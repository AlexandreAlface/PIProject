<?php

namespace App\Console\Commands;

use App\Http\Controllers\artigos;
use Illuminate\Console\Command;
use Illuminate\Http\Request;

class DailyTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:daily-tasks';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $taskController = new artigos();

        $codigo = new Request([1]);
        
        $taskController->postArtigosScopus($codigo);
        $taskController->postArtigosWBS($codigo);
        $taskController->Unificar($codigo);

        $this->info('Sucesso ! :D');
       
    }
}
