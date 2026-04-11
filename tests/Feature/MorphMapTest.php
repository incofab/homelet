<?php

use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

it('registers morph aliases for every application model', function () {
    $modelClasses = collect(File::files(app_path('Models')))
        ->map(fn ($file) => 'App\\Models\\'.$file->getBasename('.php'))
        ->values();

    $morphMap = Relation::morphMap();

    expect($morphMap)->not->toBeEmpty();

    $modelClasses->each(function (string $modelClass) use ($morphMap): void {
        $expectedAlias = Str::snake(class_basename($modelClass));

        expect($morphMap)->toHaveKey($expectedAlias, $modelClass);
        expect($morphMap)->toHaveKey($modelClass, $modelClass);
        expect((new $modelClass())->getMorphClass())->toBe($modelClass);
    });
});
