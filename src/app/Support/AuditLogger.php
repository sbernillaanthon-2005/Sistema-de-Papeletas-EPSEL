<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    /**
     * Stores operational evidence only. Never pass passwords, tokens, files or SQL here.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function record(
        Request $request,
        string $action,
        string $description,
        ?string $subjectType = null,
        ?string $subjectId = null,
        array $metadata = [],
    ): void {
        AuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'description' => $description,
            'metadata' => $metadata ?: null,
            'ip_address' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 500) ?: null,
        ]);
    }
}
