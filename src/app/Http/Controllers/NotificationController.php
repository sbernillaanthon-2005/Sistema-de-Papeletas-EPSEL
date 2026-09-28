<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $q = Notification::where('user_id', $request->user()->id);

        return response()->json(['items' => (clone $q)->latest('id')->limit(30)->get(), 'unread' => (clone $q)->whereNull('leida_at')->count()]);
    }

    public function read(Request $request, string $id)
    {
        $q = Notification::where('user_id', $request->user()->id);
        if ($id !== 'all') {
            $q->whereKey($id)->firstOrFail();
        }
        if ($id !== 'all') {
            $q->whereKey($id);
        }
        $q->whereNull('leida_at')->update(['leida_at' => now()]);

        return response()->noContent();
    }
}
