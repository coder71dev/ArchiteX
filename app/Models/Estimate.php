<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Estimate extends Model
{
    use HasUlids;
    protected $fillable = [
        'project_id',
        'version',
        'total_hours',
        'duration_weeks',
        'team_composition',
        'phase_breakdown',
        'assumptions',
        'risk_buffer_percent',
    ];

    protected $casts = [
        'id' => 'string',
        'team_composition' => 'array',
        'phase_breakdown' => 'array',
        'assumptions' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
