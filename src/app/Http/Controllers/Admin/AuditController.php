<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:120',
            'action' => 'nullable|string|max:80',
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $query = AuditLog::query()->with('actor:id,nombres,apellidos,dni')->latest('id');
        if ($request->filled('q')) {
            $term = '%'.addcslashes(trim((string) $filters['q']), '%_\\').'%';
            $query->where(function ($builder) use ($term) {
                $builder->where('description', 'ilike', $term)
                    ->orWhere('action', 'ilike', $term)
                    ->orWhereHas('actor', fn ($actor) => $actor
                        ->where('nombres', 'ilike', $term)
                        ->orWhere('apellidos', 'ilike', $term)
                        ->orWhere('dni', 'ilike', $term));
            });
        }
        if ($request->filled('action')) {
            $query->where('action', $filters['action']);
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $filters['date']);
        }

        $logs = $query->paginate(20)->withQueryString()->through(fn (AuditLog $log) => [
            'id' => $log->id,
            'action' => $log->action,
            'description' => $log->description,
            'subject_type' => $log->subject_type,
            'subject_id' => $log->subject_id,
            'metadata' => $log->metadata,
            'ip_address' => $log->ip_address,
            'created_at' => $log->created_at->toIso8601String(),
            'actor' => $log->actor ? [
                'name' => trim($log->actor->nombres.' '.$log->actor->apellidos),
                'dni' => $log->actor->dni,
            ] : null,
        ]);

        return inertia('Admin/Audit/Index', [
            'logs' => $logs,
            'filters' => $filters,
            'actions' => AuditLog::query()->distinct()->orderBy('action')->pluck('action')->values(),
            'summary' => [
                'total' => AuditLog::count(),
                'today' => AuditLog::whereDate('created_at', today('America/Lima'))->count(),
                'backups' => AuditLog::where('action', 'backup.downloaded')->count(),
            ],
        ]);
    }
}
