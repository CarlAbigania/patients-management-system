<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class MedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = ["patient_id", "visit_date", "diagnosis", "prescription"];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($medicalRecord) {
            // Clear any cached records for this patient
            cache()->forget("patient.{$medicalRecord->patient_id}.records");
        });
    }

    // Force delete the record
    public function forceDelete()
    {
        return DB::table('medical_records')->where('id', $this->id)->delete();
    }
}
