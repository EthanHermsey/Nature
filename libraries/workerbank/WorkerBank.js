class WorkerBank{

    constructor(script, num_workers){
        
        this.bank = [];
        this.queue = [];

        for(let i = 0; i < num_workers; i++){
            this.bank[i] = new WorkerBankWorker(script || './libraries/workerbank/defaultworker.js');
        }    
    }
    
    work(settings, cb){

        let foundWorker = false;
        for(let i = 0; i < this.bank.length; i++){

            if ( this.bank[i].working == false ) {
            
                foundWorker = true;
                this.bank[i].work(settings, ( data ) => {                        
                    cb( data );
                    if ( this.queue.length > 0 ){
                        const {settings, cb} = this.queue.shift();
                        this.work(settings, cb);
                    }
                }, i * 20);             

                break;

            }

        }

        if ( !foundWorker ) this.queue.push({settings, cb});

    };
}

class WorkerBankWorker extends Worker{

    constructor(script){

        super(script);
        this.working = false;

    }

    work(settings, cb, delay = 0){

        this.working = true;
        this.onmessage = (data) => {

            this.working = false;
            cb( data );
            
        };

        setTimeout(()=>{
            this.postMessage(settings);        
        }, delay);

    }

}