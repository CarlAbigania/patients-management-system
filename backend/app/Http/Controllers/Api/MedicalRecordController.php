<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class MedicalRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return MedicalRecord::with("patient:id,first_name,last_name")->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            "patient_id" => "required|exists:patients,id",
            "visit_date" => "required|date",
            "diagnosis" => "required|string",
            "prescription" => "required|string",
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        try {
            DB::beginTransaction();

            $medicalRecord = MedicalRecord::create($request->all());

            DB::commit();

            return response()->json($medicalRecord, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating medical record:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error creating medical record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(MedicalRecord $medicalRecord)
    {
        return $medicalRecord->load("patient:id,first_name,last_name");
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            // Find the record first
            $medicalRecord = MedicalRecord::find($id);

            if (!$medicalRecord) {
                Log::warning('Record not found for update', ['id' => $id]);
                return response()->json(['message' => 'Record not found'], 404)
                    ->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'PUT, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
            }

            $validator = Validator::make($request->all(), [
                "patient_id" => "sometimes|required|exists:patients,id",
                "visit_date" => "sometimes|required|date",
                "diagnosis" => "sometimes|required|string",
                "prescription" => "sometimes|required|string",
            ]);

            if ($validator->fails()) {
                return response()->json($validator->errors(), 422)
                    ->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'PUT, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
            }

            DB::beginTransaction();

            $medicalRecord->update($request->all());

            DB::commit();

            // Clear cache for this patient's records
            cache()->forget("patient.{$medicalRecord->patient_id}.records");

            return response()->json($medicalRecord)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'PUT, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating medical record:', [
                'id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error updating medical record',
                'error' => $e->getMessage()
            ], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'PUT, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        try {
            // Debug: Log the incoming request
            Log::info('=== START DELETE OPERATION ===');
            Log::info('Attempting to delete record:', ['id' => $id]);

            // Find the record first
            $medicalRecord = MedicalRecord::find($id);

            if (!$medicalRecord) {
                Log::warning('Record not found in database', ['id' => $id]);
                return response()->json(['message' => 'Record not found'], 404)
                    ->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
            }

            // Log the record details
            Log::info('Record found:', [
                'id' => $medicalRecord->id,
                'patient_id' => $medicalRecord->patient_id,
                'visit_date' => $medicalRecord->visit_date,
                'created_at' => $medicalRecord->created_at,
                'updated_at' => $medicalRecord->updated_at
            ]);

            // Try to delete the record
            $deleted = $medicalRecord->delete();

            if (!$deleted) {
                Log::error('Failed to delete record', ['id' => $id]);
                return response()->json([
                    'message' => 'Failed to delete record',
                    'error' => 'Unknown error occurred'
                ], 500)
                    ->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
            }

            Log::info('=== DELETE OPERATION SUCCESSFUL ===');
            return response()->json(null, 204)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
        } catch (\Exception $e) {
            Log::error('Error in destroy method:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error deleting medical record',
                'error' => $e->getMessage()
            ], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
        }
    }
}
