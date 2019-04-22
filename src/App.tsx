import React, { Component } from 'react';
import {FromStream} from '@neo-one/react';
import {Box, Button} from '@neo-one/react-core'; 
import {ContractsProvider, WithContracts} from './one/generated';
import { combineLatest, concat, of, timer } from 'rxjs';
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators';
import BigNumber from 'bignumber.js';
import './App.css';
import { Hash256 } from '@neo-one/client';

class App extends Component {
  render() {
    return (
      <div className="App">
      <ContractsProvider>
        <WithContracts>
          {({client, token}) => (
            <FromStream 
              props = {[client, token]}
              createStream={() => 
                concat(
                  of(undefined),
                  combineLatest(client.block$, client.currentUserAccount$).pipe(
                    switchMap(async ([{block}, account]) => {
                      const [
                        totalSupply,
                        balance,
                      ] = await Promise.all([
                        token.totalSupply(),
                        account === undefined ? Promise.resolve(new BigNumber(0)) : token.balanceOf(account.id.address),
                      ])

                      return {
                        block: block.index,
                        balance,
                        totalSupply,
                        accountID: account === undefined ? undefined : account.id,
                      }
                    })
                  )
                )
              }
            >
            {
              (value) => (
                <Box>
                  <Box>
                    {`Block: ${value === undefined ? 0 : value.block}`}
                  </Box>
                  <Box>
                    {`Balance: ${value === undefined ? 0 : value.balance}`}
                  </Box>
                  <Box>
                    {`Total Supply: ${value === undefined ? 0 : value.totalSupply}`}
                  </Box>
                  <Button onClick={() => value === undefined ? undefined : token.mintTokens.confirmed({
                    sendTo: [{
                      asset: Hash256.NEO,
                      amount: new BigNumber(10),
                    }],
                    from: value.accountID
                  })}>Get some EON!</Button>
                </Box>
              )
            }
            </FromStream>
        )}</WithContracts>
        </ContractsProvider>
      </div>
    );
  }
}

export default App;
