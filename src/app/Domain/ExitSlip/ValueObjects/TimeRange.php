<?php

declare(strict_types=1);

namespace App\Domain\ExitSlip\ValueObjects;

use InvalidArgumentException;

/**
 * Value Object: Rango de tiempo autorizado (Desde las HH:mm — Hasta las HH:mm)
 */
final class TimeRange
{
    public readonly string $from;
    public readonly string $until;

    public function __construct(string $from, string $until)
    {
        // Strip seconds if passed from DB
        $fromFormatted = strlen($from) === 8 ? substr($from, 0, 5) : $from;
        $untilFormatted = strlen($until) === 8 ? substr($until, 0, 5) : $until;
        
        $this->from = $fromFormatted;
        $this->until = $untilFormatted;
        
        $this->validate($this->from, 'from');
        $this->validate($this->until, 'until');

        if ($this->from >= $this->until) {
            throw new InvalidArgumentException(
                "La hora de inicio ({$this->from}) debe ser anterior a la hora de fin ({$this->until})."
            );
        }
    }

    private function validate(string $time, string $field): void
    {
        if (!preg_match('/^(?:[01]\d|2[0-3]):[0-5]\d$/', $time)) {
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
