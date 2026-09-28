<?php
// Test-only fixtures: refuses to write to the application's normal database.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
if (config('database.connections.pgsql.database') !== 'epsel_papeletas_test') {
    throw new RuntimeException('Browser fixtures require epsel_papeletas_test.');
}
$area = App\Models\Area::firstOrCreate(['nombre' => 'Browser QA']);
$head = null;
foreach (['area_head', 'hr', 'practitioner', 'security', 'admin'] as $index => $role) {
    $user = App\Models\User::updateOrCreate(['email' => $role.'@browser.test'], [
        'nombres' => 'Prueba', 'apellidos' => $role, 'dni' => '9900000'.$index,
        'password' => 'Browser-test-only-2026!', 'rol' => $role, 'activo' => true,
        'area_id' => $area->id, 'jefe_id' => $role === 'practitioner' ? $head->id : null,
        'cargo_designado' => 'Prueba de navegador',
    ]);
    if ($role === 'area_head') $head = $user;
    $image = imagecreatetruecolor(200, 80);
    imagefill($image, 0, 0, imagecolorallocate($image, 255, 255, 255));
    imagestring($image, 5, 15, 30, 'FIRMA DE PRUEBA', imagecolorallocate($image, 0, 0, 100));
    ob_start(); imagepng($image); $bytes = ob_get_clean(); imagedestroy($image);
    $path = 'browser-fixtures/'.$user->id.'.png';
    Illuminate\Support\Facades\Storage::disk('private')->put($path, $bytes);
    App\Models\Signature::updateOrCreate(['user_id' => $user->id], ['ruta_archivo' => $path, 'mime' => 'image/png', 'hash_sha256' => hash('sha256', $bytes)]);
}
echo "Browser fixtures ready in isolated test database.\n";
