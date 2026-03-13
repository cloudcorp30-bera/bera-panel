<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class AddNullableFieldLastrun extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE tasks ALTER COLUMN last_run DROP NOT NULL;');
        } else {
            $table = DB::getQueryGrammar()->wrapTable('tasks');
            DB::statement('ALTER TABLE ' . $table . ' CHANGE `last_run` `last_run` TIMESTAMP NULL;');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE tasks ALTER COLUMN last_run SET NOT NULL;');
        } else {
            $table = DB::getQueryGrammar()->wrapTable('tasks');
            DB::statement('ALTER TABLE ' . $table . ' CHANGE `last_run` `last_run` TIMESTAMP;');
        }
    }
}
