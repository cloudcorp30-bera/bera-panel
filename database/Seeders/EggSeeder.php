<?php

namespace Database\Seeders;

use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Illuminate\Database\Seeder;
use Illuminate\Http\UploadedFile;
use Pterodactyl\Services\Eggs\Sharing\EggImporterService;
use Pterodactyl\Services\Eggs\Sharing\EggUpdateImporterService;

class EggSeeder extends Seeder
{
    protected EggImporterService $importerService;

    protected EggUpdateImporterService $updateImporterService;

    /**
     * @var string[]
     */
    public static array $import = [
        'Minecraft',
        'Source Engine',
        'Voice Servers',
        'Rust',
    ];

    /**
     * EggSeeder constructor.
     */
    public function __construct(
        EggImporterService $importerService,
        EggUpdateImporterService $updateImporterService,
    ) {
        $this->importerService = $importerService;
        $this->updateImporterService = $updateImporterService;
    }

    /**
     * Run the egg seeder.
     */
    public function run()
    {
        foreach (static::$import as $nest) {
            /* @noinspection PhpParamsInspection */
            $this->parseEggFiles(
                Nest::query()->where('author', 'support@pterodactyl.io')->where('name', $nest)->firstOrFail()
            );
        }
    }

    /**
     * Loop through the list of egg files and import them.
     */
    protected function parseEggFiles(Nest $nest)
    {
        $files = new \DirectoryIterator(database_path('Seeders/eggs/' . kebab_case($nest->name)));

        $this->command->alert('Updating Eggs for Nest: ' . $nest->name);
        /** @var \DirectoryIterator $file */
        foreach ($files as $file) {
            if (!$file->isFile() || !$file->isReadable()) {
                continue;
            }

            $decoded = json_decode(file_get_contents($file->getRealPath()), true, 512, JSON_THROW_ON_ERROR);
            $uploadedFile = new UploadedFile($file->getPathname(), $file->getFilename(), 'application/json');

            $egg = $nest->eggs()
                ->where('author', $decoded['author'])
                ->where('name', $decoded['name'])
                ->first();

            try {
                if ($egg instanceof Egg) {
                    $this->updateImporterService->handle($egg, $uploadedFile);
                    $this->command->info('Updated ' . $decoded['name']);
                } else {
                    $this->importerService->handle($uploadedFile, $nest->id);
                    $this->command->comment('Created ' . $decoded['name']);
                }
            } catch (\Throwable $e) {
                // On PostgreSQL a failed statement inside a transaction aborts the whole
                // transaction (SQLSTATE 25P02). Roll back and reconnect so subsequent
                // eggs can still be processed.
                try {
                    \Illuminate\Support\Facades\DB::rollBack();
                } catch (\Throwable $rb) {
                    // Ignore rollback errors — connection may already be clean.
                }
                \Illuminate\Support\Facades\DB::reconnect();

                $this->command->error('Failed to import/update "' . $decoded['name'] . '": ' . $e->getMessage());
            }
        }

        $this->command->line('');
    }
}
