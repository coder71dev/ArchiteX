<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    use HasUlids;

    protected $fillable = [
        'project_id',
        'version',
        'content',
        'executive_summary',
        'technical_challenges',
        'tone',
    ];

    protected $casts = [
        'id' => 'string',
        'technical_challenges' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
