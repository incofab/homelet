<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaService
{
    public function store(UploadedFile $file, $model, string $collection, int $creatorId): Media
    {
        $disk = config('filesystems.default', 'public');
        $isVideo = str_starts_with((string) $file->getMimeType(), 'video/');
        $extension = $file->getClientOriginalExtension() ?: $file->extension();
        info(['disk' => $disk, 's3' => config('filesystems.disks.s3_public')]);
        
        $directory = sprintf(
            'media/%s/%s/%s',
            Str::snake(class_basename($model)),
            $model->getKey(),
            $collection
        );

        $path = $file->storeAs(
            $directory,
            Str::uuid()->toString().($extension ? '.'.$extension : ''),
            ['disk' => $disk]
        );

        if(!$path){
            throw new \Exception('Failed to store media');
        }

        $url = null;
        $storage = Storage::disk($disk);
        if (method_exists($storage, 'url')) {
            $url = $storage->url($path);
        }

        return Media::query()->create([
            'model_type' => $model::class,
            'model_id' => $model->getKey(),
            'collection' => $collection,
            'disk' => $disk,
            'path' => $path,
            'url' => $url,
            'mime_type' => (string) $file->getMimeType(),
            'size' => $file->getSize(),
            'is_video' => $isVideo,
            'metadata' => [
                'original_name' => $file->getClientOriginalName(),
            ],
            'created_by' => $creatorId,
        ]);
    }

    public function delete(Media $media): void
    {
        Storage::disk($media->disk)->delete($media->path);
        $media->delete();
    }
}
