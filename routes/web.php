<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\IntegrationController;
use App\Http\Controllers\MilestoneController;
use App\Http\Controllers\PlanningWizardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ProjectExportController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TeamMemberController;
use App\Http\Controllers\TeamWorkloadController;
use Illuminate\Support\Facades\Route;

Route::get('login', [AuthController::class, 'showLogin'])->name('login');
Route::post('login', [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware('auth')->group(function () {
    Route::get('/', function () {
        return redirect()->route('dashboard');
    });

    Route::get('/dashboard', [ProjectController::class, 'index'])->name('dashboard');

    // Planning Wizard Routes
    Route::prefix('projects')->name('projects.')->group(function () {
        // Wizard Steps
        Route::get('/create', [PlanningWizardController::class, 'create'])->name('create');
        Route::post('/wizard/idea', [PlanningWizardController::class, 'submitIdea'])->name('wizard.idea');
        Route::get('/{project}/questions', [PlanningWizardController::class, 'questions'])->name('questions');
        Route::post('/{project}/wizard/answers', [PlanningWizardController::class, 'submitAnswers'])->name('wizard.answers');
        Route::get('/{project}/architecture', [PlanningWizardController::class, 'architecture'])->name('architecture');
        Route::post('/{project}/wizard/approve-architecture', [PlanningWizardController::class, 'approveArchitecture'])->name('wizard.approve-architecture');
        Route::post('/{project}/wizard/override-architecture', [PlanningWizardController::class, 'overrideArchitecture'])->name('wizard.override-architecture');
        Route::post('/{project}/wizard/regenerate-blueprint', [PlanningWizardController::class, 'regenerateBlueprint'])->name('wizard.regenerate-blueprint');
        Route::get('/{project}/milestones', [PlanningWizardController::class, 'milestones'])->name('milestones');
        Route::post('/{project}/wizard/approve-milestones', [PlanningWizardController::class, 'approveMilestones'])->name('wizard.approve-milestones');
        Route::get('/{project}/tasks', [PlanningWizardController::class, 'tasks'])->name('tasks');
        Route::post('/{project}/wizard/approve-tasks', [PlanningWizardController::class, 'approveTasks'])->name('wizard.approve-tasks');
        Route::get('/{project}/team', [PlanningWizardController::class, 'team'])->name('team');
        Route::post('/{project}/wizard/assign-team', [PlanningWizardController::class, 'assignTeam'])->name('wizard.assign-team');
        Route::get('/{project}/wizard/status', [PlanningWizardController::class, 'getStatus'])->name('wizard.status');

        // Standard Project Routes
        Route::post('/', [ProjectController::class, 'store'])->name('store');
        Route::get('/{project}', [ProjectController::class, 'show'])->name('show');
        Route::post('/{project}/chat', [ProjectController::class, 'chat'])->name('chat');
        Route::post('/{project}/auto-assign', [ProjectController::class, 'autoAssignTasks'])->name('auto-assign');
        Route::get('/{project}/export/pdf', [ProjectExportController::class, 'exportPdf'])->name('export.pdf');
        Route::get('/{project}/export/excel', [ProjectExportController::class, 'exportExcel'])->name('export.excel');
    });

    // Task Routes
    Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
    Route::put('/tasks/{task}/status', [TaskController::class, 'updateStatus'])->name('tasks.update-status');
    Route::put('/tasks/{task}/checklist', [TaskController::class, 'updateChecklist'])->name('tasks.update-checklist');
    Route::put('/tasks/{task}/assign', [TaskController::class, 'assign'])->name('tasks.assign');
    Route::post('/tasks/bulk-reassign', [TaskController::class, 'bulkReassign'])->name('tasks.bulk-reassign');

    // Milestone Routes
    Route::put('/milestones/{milestone}', [MilestoneController::class, 'update'])->name('milestones.update');
    Route::delete('/milestones/{milestone}', [MilestoneController::class, 'destroy'])->name('milestones.destroy');

    // Integration Routes
    Route::post('/projects/{project}/integrations', [IntegrationController::class, 'store'])->name('integrations.store');
    Route::post('/projects/{project}/integrations/{integration}/sync', [IntegrationController::class, 'sync'])->name('integrations.sync');
    Route::post('/projects/{project}/integrations/{integration}/test', [IntegrationController::class, 'test'])->name('integrations.test');

    // Team Routes
    Route::prefix('team-members')->name('team-members.')->group(function () {
        Route::get('/', [TeamMemberController::class, 'index'])->name('index');
        Route::post('/sync', [TeamMemberController::class, 'sync'])->name('sync');
        Route::get('/{teamMember}', [TeamMemberController::class, 'show'])->name('show');
        Route::put('/{teamMember}', [TeamMemberController::class, 'update'])->name('update');
        Route::delete('/{teamMember}', [TeamMemberController::class, 'destroy'])->name('destroy');
    });

    // Workload Dashboard
    Route::get('/team-workload', [TeamWorkloadController::class, 'index'])->name('team-workload');
});
