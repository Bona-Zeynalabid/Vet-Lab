import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Case from '@/models/Case';
import Bacteriology from '@/models/Bacteriology';
import Parasitology from '@/models/Parasitology';
import Pathology from '@/models/Pathology';
import Diagnosis from '@/models/Diagnosis';
import Pharmacy from '@/models/Pharmacy';
import LabRequest from '@/models/LabRequest';
import BacteriologyRequest from '@/models/BacteriologyRequest';
import ParasitologyRequest from '@/models/ParasitologyRequest';
import PathologyRequest from '@/models/PathologyRequest';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─── POST: archive a case ───────────────────────────────────────────────
export async function POST(request) {
  try {
    await dbConnect();
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    // Fetch case
    const caseDoc = await Case.findOne({ 'caseInfo.caseNumber': caseId });
    if (!caseDoc) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Fetch lab records (any)
    const bacteriology = await Bacteriology.findOne({ caseId });
    const parasitology = await Parasitology.findOne({ caseId });
    const pathology = await Pathology.findOne({ caseId });

    // Fetch diagnosis
    const diagnosis = await Diagnosis.findOne({ caseId });

    // Fetch all pharmacy records for this case
    const pharmacyRecords = await Pharmacy.find({ caseId });

    // Build lab method and result strings
    let sampleTaken = '';
    let labMethods = '';
    let labResult = '';

    if (bacteriology) {
      sampleTaken = bacteriology.sample?.type || '';
      labMethods = bacteriology.cultureDetails?.mediaUsed?.join(', ') || '';
      labResult =
        bacteriology.organismIdentification?.organismName ||
        bacteriology.interpretation ||
        '';
    } else if (parasitology) {
      sampleTaken = parasitology.sample?.type || '';
      labMethods =
        parasitology.fecalExamination?.methodsPerformed?.join(', ') || '';
      labResult = parasitology.interpretation || '';
    } else if (pathology) {
      sampleTaken = 'Multiple (Pathology)';
      labMethods = 'Pathology Panel';
      labResult = pathology.technician || '';
    }

    // Build treatment — comma-separated fields per medicine, "; " between medicines
    let treatmentGiven = '';
    if (pharmacyRecords && pharmacyRecords.length > 0) {
      const parts = pharmacyRecords
        .filter((rec) => rec.medicine && rec.medicine.name)
        .map((rec) => {
          const m = rec.medicine;
          const fields = [
            m.name,
            m.concentration ? `Conc: ${m.concentration}` : null,
            m.dosage ? `Dose: ${m.dosage}` : null,
            m.route ? `Route: ${m.route}` : null,
            m.frequency ? `Freq: ${m.frequency}` : null,
            m.duration ? `Duration: ${m.duration}` : null,
            m.amount ? `Amount: ${m.amount}` : null,
            m.instructions ? `Note: ${m.instructions}` : null,
          ].filter(Boolean);
          return fields.join(', ');
        });
      treatmentGiven = parts.join('; ');
    }

    // Prepare row
    const row = {
      date: caseDoc.caseInfo?.date || null,
      case_no: caseDoc.caseInfo?.caseNumber || '',
      owner_name: caseDoc.owner?.fullName || '',
      address: caseDoc.owner?.address || '',
      tel_no: caseDoc.owner?.telephone || '',
      species: caseDoc.patient?.species || '',
      no_of_animals: caseDoc.patient?.numberOfAnimals || 1,
      breed: caseDoc.patient?.breed || '',
      animal_id: caseDoc.patient?.animalId || '',
      sex: caseDoc.patient?.sex || '',
      age: caseDoc.patient?.age || '',
      body_weight: caseDoc.patient?.weight || null,
      case_history: caseDoc.anamnesis?.history || '',
      owners_complaint: caseDoc.anamnesis?.primaryComplaint || '',
      history_anamnesis: caseDoc.anamnesis?.history || '',
      clinical_findings: caseDoc.physicalExam?.otherFindings || '',
      demeanor: caseDoc.physicalExam?.demeanor || '',
      mucous_membrane: caseDoc.physicalExam?.mucousMembrane || '',
      crt: caseDoc.physicalExam?.crt || '',
      heart_sound: caseDoc.physicalExam?.heartSound || '',
      lung_sound: caseDoc.physicalExam?.lungSound || '',
      bcs: caseDoc.physicalExam?.bcs || '',
      respiratory_rate: caseDoc.physicalExam?.respiratoryRate || '',
      pulse_rate: caseDoc.physicalExam?.pulseRate || '',
      gi_motility: caseDoc.physicalExam?.giMotility || '',
      temperature: caseDoc.physicalExam?.temperature || null,
      other_clinical_findings: caseDoc.physicalExam?.otherFindings || '',
      differential_diagnosis:
        diagnosis?.tentativeDiagnosis?.differentials?.join(', ') || '',
      tentative_diagnosis: diagnosis?.tentativeDiagnosis?.primary || '',
      sample_taken: sampleTaken,
      lab_methods: labMethods,
      lab_result: labResult,
      definitive_diagnosis:
        diagnosis?.definitiveDiagnosis?.finalDiagnosis || '',
      treatment_given: treatmentGiven,
      prognosis: diagnosis?.prognosis || '',
      advice_to_owner: diagnosis?.followUp?.instructions || '',
      veterinarian_name: caseDoc.by || diagnosis?.veterinarian?.name || '',
      veterinarian_signature: caseDoc.by || diagnosis?.veterinarian?.name || '',
    };

    // Insert into Supabase
    const { error: supabaseError } = await supabaseAdmin
      .from('completed_cases')
      .insert([row]);

    if (supabaseError) {
      return NextResponse.json({ error: supabaseError.message }, { status: 500 });
    }

    // ========== DELETE ALL MONGODB DATA ==========
    const deletionPromises = [
      Case.deleteOne({ _id: caseDoc._id }),
      Bacteriology.deleteMany({ caseId }),
      Parasitology.deleteMany({ caseId }),
      Pathology.deleteMany({ caseId }),
      Diagnosis.deleteMany({ caseId }),
      Pharmacy.deleteMany({ caseId }),
      LabRequest.deleteMany({ caseId }),
      BacteriologyRequest.deleteMany({ caseId }),
      ParasitologyRequest.deleteMany({ caseId }),
      PathologyRequest.deleteMany({ caseId }),
    ];

    await Promise.all(deletionPromises);

    return NextResponse.json({
      success: true,
      message: 'Case archived and deleted from MongoDB',
    });
  } catch (error) {
    console.error('Archive error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── GET: list completed cases (with optional search) ──────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = supabaseAdmin
      .from('completed_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      query = query.or(
        `case_no.ilike.%${search}%,owner_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('GET completed cases error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE: remove a completed case by ID ─────────────────────────────
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('completed_cases')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted case #${data[0].case_no}`,
    });
  } catch (err) {
    console.error('DELETE completed case error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}