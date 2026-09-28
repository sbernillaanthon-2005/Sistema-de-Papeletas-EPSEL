<?php

namespace App\Http\Requests;

use App\Domain\ExitSlip\Enums\ExitReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveExitSlipRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motivo_salida' => ['required', Rule::enum(ExitReason::class)],
            'motivo_detalle' => ['required', 'string', 'max:2000'],
            'fecha_autorizada' => ['required', 'date_format:Y-m-d', 'after_or_equal:'.now('America/Lima')->toDateString()],
            'hora_desde' => ['required', 'date_format:H:i'],
            'hora_hasta' => ['required', 'date_format:H:i', 'after:hora_desde'],
        ];
    }
}
