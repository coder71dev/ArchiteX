<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Blueprint extends Model
{
    use HasUlids;
    protected $fillable = [
        'project_id',
        'version',
        'change_summary',
        'overview',
        'strategy',
        'scope',
        'architecture',
        'component_details',
        'tech_stack',
        'milestones',
        'roadmap',
        'reliability_score',
    ];

    protected $casts = [
        'id' => 'string',
        'strategy' => 'array',
        'scope' => 'array',
        'architecture' => 'array',
        'component_details' => 'array',
        'tech_stack' => 'array',
        'milestones' => 'array',
        'roadmap' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
