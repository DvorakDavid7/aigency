<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Socialite\Socialite;

Route::get('/auth/redirect', function () {
    /** @var \Laravel\Socialite\Two\FacebookProvider $facebook */
    $facebook = Socialite::driver('facebook');

    return $facebook
        ->scopes(['ads_management', 'ads_read', 'read_insights'])
        ->redirect();
});

Route::get('/auth/callback', function () {
    /** @var \Laravel\Socialite\Two\FacebookProvider $facebook */
    $facebook = Socialite::driver('facebook');

    $user = $facebook->user();
    dd($user);
});

Route::get('/', function () {
    return Inertia::render('Test', [
        'name' => 'David',
    ]);
});
