<?php

declare(strict_types=1);

namespace Pterodactyl\Tests\Pest\Unit\Services\Files\GitHubRepositoryImporterTest;

use Mockery;
use Pterodactyl\Contracts\Files\CreatesDirectories;
use Pterodactyl\Contracts\Files\DeletesFiles;
use Pterodactyl\Contracts\Files\ListsDirectories;
use Pterodactyl\Contracts\Files\WritesFileContents;
use Pterodactyl\Services\Files\GitHubRepositoryImporter;
use Pterodactyl\Tests\TestCase;
use ReflectionMethod;
use Symfony\Component\HttpKernel\Exception\HttpException;
use ZipArchive;

uses(TestCase::class);

function validate(array $files, ?string $symlink = null): array
{
    $path = tempnam(sys_get_temp_dir(), 'ibis-import-test-');
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::OVERWRITE);
    foreach ($files as $name => $content) {
        $zip->addFromString($name, $content);
        if ($name === $symlink) {
            $zip->setExternalAttributesName($name, ZipArchive::OPSYS_UNIX, 0120777 << 16);
        }
    }
    $zip->close();
    $zip->open($path);
    try {
        $importer = new GitHubRepositoryImporter(
            Mockery::mock(ListsDirectories::class),
            Mockery::mock(CreatesDirectories::class),
            Mockery::mock(WritesFileContents::class),
            Mockery::mock(DeletesFiles::class),
        );

        return (new ReflectionMethod($importer, 'validateArchive'))->invoke($importer, $zip);
    } finally {
        $zip->close();
        unlink($path);
    }
}

test('a normal archive is flattened and its lockfile is detected', function (): void {
    [$entries, $bytes, $lockfile] = validate(['repo-sha/package.json' => '{}', 'repo-sha/package-lock.json' => '{}']);
    expect($entries)->toBe([[0, 'package.json'], [1, 'package-lock.json']])
        ->and($bytes)->toBe(4)
        ->and($lockfile)->toBeTrue();
});

test('unsafe paths, duplicate entries and symlinks are rejected before writing', function (array $files, ?string $symlink): void {
    expect(fn () => validate($files, $symlink))->toThrow(HttpException::class);
})->with([
    'traversal' => [['repo-sha/../escape.txt' => 'bad'], null],
    'absolute-like path' => [['repo-sha//escape.txt' => 'bad'], null],
    'backslash' => [['repo-sha/a\..\escape.txt' => 'bad'], null],
    'mixed roots' => [['repo-one/a.txt' => 'a', 'repo-two/b.txt' => 'b'], null],
    'symlink' => [['repo-sha/link' => 'target'], 'repo-sha/link'],
]);

test('per-file and file-count limits reject archive bombs', function (array $files): void {
    expect(fn () => validate($files))->toThrow(HttpException::class);
})->with([
    'large file' => [['repo-sha/large.bin' => str_repeat('x', 10_000_001)]],
    'too many files' => [array_fill_keys(array_map(fn (int $i) => "repo-sha/$i.txt", range(1, 1001)), 'x')],
]);
