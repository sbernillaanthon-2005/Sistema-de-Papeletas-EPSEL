<?php

declare(strict_types=1);

namespace App\Application\User\Actions;

use App\Domain\User\Enums\UserRole;
use App\Domain\User\Repositories\UserRepositoryInterface;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class RegisterUser
{
    public function __construct(
        private readonly UserRepositoryInterface $repository
    ) {}

    public function execute(array $data): User
    {
        // Enforce PRACTITIONER role always for public registration
        $data['rol'] = UserRole::PRACTITIONER->value;
        $data['password'] = Hash::make($data['password']);
        $data['id'] = Str::uuid()->toString();
        $data['activo'] = true;

        if (empty($data['dni']) || strlen($data['dni']) !== 8) {
            throw new InvalidArgumentException("DNI debe tener 8 dígitos.");
        }

        // Auto-assign jefe_id if area has a Head
        $data['jefe_id'] = null;
        if (!empty($data['area_id'])) {
            $heads = $this->repository->findByAreaAndRole($data['area_id'], UserRole::AREA_HEAD);
            if (count($heads) > 0) {
                $data['jefe_id'] = $heads[0]->id;
            }
        }

        $user = new User($data);
        return $this->repository->save($user);
    }
}
