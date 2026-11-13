<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('push_enabled')->default(false);
            $table->boolean('is_push_test')->default(false);
        });
        Schema::create('push_subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->morphs('subscribable');
            $table->char('endpoint_hash', 64)->unique();
            $table->text('endpoint');
            $table->text('public_key');
            $table->text('auth_token');
            $table->string('content_encoding', 20)->default('aes128gcm');
            $table->string('label', 80)->default('Dispositivo');
            $table->timestamp('last_success_at')->nullable();
            $table->string('last_result', 40)->nullable();
            $table->timestamps();
        });
        Schema::create('push_deliveries', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('batch_id')->index();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('subscription_id')->index();
            $table->text('payload');
            $table->string('status', 20)->default('queued')->index();
            $table->string('result', 40)->nullable();
            $table->unsignedSmallInteger('provider_status')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamps();
        });
        Schema::create('push_test_tokens', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->char('token_hash', 64)->unique();
            $table->timestamp('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_test_tokens');
        Schema::dropIfExists('push_deliveries');
        Schema::dropIfExists('push_subscriptions');
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['push_enabled', 'is_push_test']);
        });
    }
};
