<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class Integration extends Model
{
    use HasUlids;

    protected $fillable = [
        'project_id',
        'type',
        'config',
        'last_sync_at',
        'status',
    ];

    protected $casts = [
        'id' => 'string',
        'config' => 'array',
        'last_sync_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
