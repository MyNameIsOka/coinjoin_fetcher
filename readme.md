# ToDo
1. Speed up. It's slow.
    - Fetch blocks locally from blk files
2. Improve the commands. 
    - Check if previously started analysis is already finished
    - fetch results from remote
    - set file name according to dates 
3. Parallelize calculation
4. Use a proper DB 
5. Fetch available results 
6. Add Coinjoins from Samourai Wallet 
7. Delete entries out of the defined time duration. Currently too many TXs are fetched sometimes.


# Prerequisites
1. nodejs and npm
2. Fully synced bitcoind node with `-txindex=1`, `-server=1` and `-rest=1` set

# Installation
1. Pull this repository
2. `npm install`
3. Create a file  `credentials.ts` in folder `src` 
4. set the `rpc username` and `password` for your bitcoind instance and set the `host` of the bitcoind node as follows
```
export const user: string = 'user';
export const pass: string = 'password';
export const hostAddr: string = '1.2.3.4';
```

# Usage
1. in the root folder: `npm run start` 
2. in your browser, open the website:    
`http://127.0.0.1:3000/btc?dateStart=2020-01-29&dateEnd=2020-02-01&filename=output`    
`dateStart` and `dateEnd` have to be set in the format `yyyy-mm-dd`    
`filename` should be a single word with no special characters   
3. Wait... The website can be closed at this point.    
The terminal where `npm run start` was exectued has to remain active.    
**Be careful**, as the script is painfully slow. ~20days worth of blockchain took ~4 hours to finish on a MacBook Retina, 12-inch, Early 2016. The process can be aborted anytime via Ctrl+C (Windows + OSX) in the terminal window, where the `npm run start` command was executed.    
**NOTE**: If the process is aborted, the file will not be created.    
    
The resulting file can be found in the `data` folder of the project folder.    
The output will look something like:
```
[
  ...
  {
    "height": 618051,
    "date": "19-02-2020",
    "value": "0.10991871",
    "count": 51,
    "txid": "a3e24025cffeb44165ca2ad9538a9febbe093ecffe750b54672a1850648a53f4",
    "total BTC": 5.60585421,
    "USD value": 56339.2272202947
  },
  {
    "height": 618047,
    "date": "19-02-2020",
    "value": "0.1099207",
    "count": 64,
    "txid": "9d965bd2a169644b9530fa20df73f6a60167be1a2a231ae28f05c01a345f4c93",
    "total BTC": 7.0349248,
    "USD value": 70701.486684736
  },
  ...
```

4. After it is finished, the total BTC and USD value can be calculated with:    
 `http://127.0.0.1:3000/convert?filename=output`    
The output will look something like:
```
USD value: $32085, total BTC: 3.44703636
```
