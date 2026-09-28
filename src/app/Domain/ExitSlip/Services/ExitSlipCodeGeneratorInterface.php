<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip\Services;

interface ExitSlipCodeGeneratorInterface
{
    /**
     * Generates a safe sequential code for the given year, e.g., "PS-2026-000123"
     */
    public function generateForYear(int $year): string;
}
