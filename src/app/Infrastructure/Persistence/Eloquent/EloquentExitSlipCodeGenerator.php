<?php

declare(strict_types=1);

namespace App\Infrastructure\Persistence\Eloquent;

use App\Domain\ExitSlip\Services\ExitSlipCodeGeneratorInterface;
use App\Models\ExitSlipSequence;
use Illuminate\Support\Facades\DB;

final class EloquentExitSlipCodeGenerator implements ExitSlipCodeGeneratorInterface
{
    public function generateForYear(int $year): string
    {
        return DB::transaction(function () use ($year) {
            $sequenceData = ['year' => $year, 'last_number' => 0, 'created_at' => now(), 'updated_at' => now()];
            ExitSlipSequence::query()->insertOrIgnore($sequenceData);
            $sequence = ExitSlipSequence::where('year', $year)->lockForUpdate()->firstOrFail();

            $sequence->last_number += 1;
            $sequence->save();

            $padded = str_pad((string) $sequence->last_number, 6, '0', STR_PAD_LEFT);
            return sprintf('PS-%d-%s', $year, $padded);
        });
    }
}
