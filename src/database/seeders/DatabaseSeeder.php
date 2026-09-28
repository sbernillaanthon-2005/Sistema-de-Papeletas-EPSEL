<?php

namespace Database\Seeders;

use App\Domain\User\Enums\UserRole;
use App\Models\Area;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Áreas
        $sistemas = Area::create(['id' => Str::uuid(), 'nombre' => 'Sub Gerencia de Sistemas e Informática']);
        $rrhh = Area::create(['id' => Str::uuid(), 'nombre' => 'Oficina de Recursos Humanos']);
        $admin = Area::create(['id' => Str::uuid(), 'nombre' => 'Administración']);

        // 2. Administrador y RRHH
        User::create([
            'id' => Str::uuid(),
            'nombres' => 'Admin',
            'apellidos' => 'Sistema',
            'dni' => '00000000',
            'email' => 'admin@epsel.com.pe',
            'password' => 'password', // will be hashed by model cast
            'rol' => UserRole::ADMIN,
            'area_id' => $admin->id,
        ]);

        User::create([
            'id' => Str::uuid(),
            'nombres' => 'Especialista',
            'apellidos' => 'Recursos Humanos',
            'dni' => '11111111',
            'email' => 'rrhh@epsel.com.pe',
            'password' => 'password',
            'rol' => UserRole::HR,
            'area_id' => $rrhh->id,
        ]);
        
        // Control de Vigilancia
        User::create([
            'id' => Str::uuid(),
            'nombres' => 'Control',
            'apellidos' => 'Vigilancia',
            'dni' => '22222222',
            'email' => 'vigilancia@epsel.com.pe',
            'password' => 'password',
            'rol' => UserRole::SECURITY,
        ]);

        // 3. Jefe de Área (Sistemas)
        $jefeSistemas = User::create([
            'id' => Str::uuid(),
            'nombres' => 'Jefe',
            'apellidos' => 'Sistemas',
            'dni' => '33333333',
            'email' => 'jefe.sistemas@epsel.com.pe',
            'password' => 'password',
            'rol' => UserRole::AREA_HEAD,
            'area_id' => $sistemas->id,
            'cargo_designado' => 'Sub Gerente de Sistemas',
        ]);

        // 4. Practicante y Trabajador (Sistemas)
        User::create([
            'id' => Str::uuid(),
            'nombres' => 'Juan',
            'apellidos' => 'Practicante',
            'dni' => '44444444',
            'email' => 'practicante@epsel.com.pe',
            'password' => 'password',
            'rol' => UserRole::PRACTITIONER,
            'area_id' => $sistemas->id,
            'cargo_designado' => 'Practicante Pre-Profesional',
            'jefe_id' => $jefeSistemas->id,
        ]);
        
        User::create([
            'id' => Str::uuid(),
            'nombres' => 'Carlos',
            'apellidos' => 'Trabajador',
            'dni' => '55555555',
            'email' => 'trabajador@epsel.com.pe',
            'password' => 'password',
            'rol' => UserRole::WORKER,
            'area_id' => $sistemas->id,
            'cargo_designado' => 'Analista Desarrollador',
            'jefe_id' => $jefeSistemas->id,
        ]);
    }
}
