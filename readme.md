// 1. check which block is latest in the database (Set at first start) and which is most recent
// 2. Fetch all transactions from that block+1
// 3. Check if any transaction had 10+ inputs with same values between 0.08 and 0.12 (?)
// 4. If there is, sum up the output of the equal outputs
// 5. Get the rate at that time and calculate $ value
// 6. send the values to a database?
// 7. Repeat from step 2 until step 7
// 8. If newest block has been scanned wait for 10 minutes