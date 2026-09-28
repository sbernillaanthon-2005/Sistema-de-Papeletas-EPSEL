<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip\ValueObjects;

use InvalidArgumentException;

/**
 * Value Object: Rango de tiempo autorizado (Desde las HH:mm — Hasta las HH:mm)
 */
final class TimeRange
{
    public function __construct(
        public readonly string $from,  // "HH:mm"
        public readonly string $until, // "HH:mm"
    ) {
        $this->validate($from, 'from');
        $this->validate($until, 'until');

        if ($from >= $until) {
            throw new InvalidArgumentException(
                "La hora de inicio ({$from}) debe ser anterior a la hora de fin ({$until})."
            );
        }
    }

    private function validate(string $time, string $field): void
    {
        if (!preg_match('/^\d{2}:\d{2}$/', $time)) {
            throw new InvalidArgumentException(
                "El campo '{$field}' debe tener formato HH:mm. Recibido: {$time}"
            );
        }
    }

    public function duration(): string
    {
        [$fh, $fm] = explode(':', $this->from);
        [$uh, $um] = explode(':', $this->until);

        $minutes = ((int)$uh * 60 + (int)$um) - ((int)$fh * 60 + (int)$fm);
        $h = intdiv($minutes, 60);
        $m = $minutes % 60;

        return sprintf('%dh %02dmin', $h, $m);
    }

    public function equals(self $other): bool
    {
        return $this->from === $other->from && $this->until === $other->until;
    }

    public function __toString(): string
    {
        return "{$this->from} — {$this->until}";
    }
}
