<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return $user->activo && (string) $user->id === (string) $id;
});

Broadcast::channel('head.{id}', function ($user, $id) {
    return $user->activo && $user->rol?->value === 'area_head' && (string) $user->id === (string) $id;
});

Broadcast::channel('practitioner.{id}', function ($user, $id) {
    return $user->activo && (string) $user->id === (string) $id;
});
