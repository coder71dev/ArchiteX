<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Model;

class TaskAssignmentLog extends Model
{
    use HasUlids;

    protected $fillable = [
        'task_id',
        'from_member_id',
        'to_member_id',
        'reason',
        'changed_by',
    ];

    protected $casts = [
        'id' => 'string',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function fromMember()
    {
        return $this->belongsTo(TeamMember::class, 'from_member_id');
    }

    public function toMember()
    {
        return $this->belongsTo(TeamMember::class, 'to_member_id');
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
