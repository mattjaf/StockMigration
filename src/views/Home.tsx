/*eslint-disable*/
import { VStack, Heading, Button, Textarea, List, ListItem } from '@chakra-ui/react';
import { useState } from 'react';
import { useMoralisWeb3Api, useMoralis } from 'react-moralis';
import {Moralis} from 'moralis-v1';
import { CHAIN_NAMESPACES } from "@web3auth/base";


const Home = () => {
  const api = useMoralisWeb3Api();
  const [output, setOutput] = useState<string>();
  const {chainId, authenticate, account} = useMoralis();


  function print(value: unknown) {
    setOutput(JSON.stringify(value));
  }

  async function getNFTMetadata() {
    const metadata = await api.token.getNFTMetadata({
      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
    });
    print(metadata);
  }

  async function getBlock() {
    const block = await api.native.getBlock({
      chain: '0x13881',
      block_number_or_hash: '10000',
    });
    print(block);
  }

  async function runContractFunction() {
    const ABI = [
      {
        inputs: [
          {
            internalType: 'uint256',
            name: '_tokenId',
            type: 'uint256',
          },
        ],
        name: 'ownerOf',
        outputs: [
          {
            internalType: 'address',
            name: '',
            type: 'address',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
    ];
    const options = {
      address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      function_name: 'ownerOf',
      chain: 'eth',
      params: {
        _tokenId: '6651',
      },
      abi: ABI,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await api.native.runContractFunction(options as any);
    print(result);
  }

  async function resolveDomain() {
    const result = await api.resolve.resolveDomain({
      domain: 'brad.crypto',
    });
    print(result);
  }

  async function web3ApiVersion() {
    const result = await api.info.web3ApiVersion();
    print(result);
  }

  async function getChainId() { 
    print(chainId);
  }

  async function getWeb3Auth() {
    const web3Auth = Moralis?.connector?.web3Instance;
    console.log(web3Auth)
    const result = await web3Auth.getUserInfo();
    console.log(result)

    const connector = Moralis.Web3.connector;
    console.log(connector.web3Instance)
    //await connector?.web3Instance?.walletAdapters["wallet-connect-v1"]?.switchChain({ chainId: "0x5" })
    
    
  }

  async function switchChain() {
    const web3Auth = Moralis?.connector?.web3Instance;
    console.log(web3Auth)
    try {
      await web3Auth.switchChain({ chainId: "0x5" })//.catch((error) => { console.log(error) });
    }
    catch (error) {
      //console.error('Failed to switch network', error);
    }
  }
  
  async function addchain() {
    const web3Auth = Moralis?.connector?.web3Instance;
    console.log(web3Auth)
    await web3Auth.addChain({
      chainId: "0x5",
      displayName: "Goerli",
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      tickerName: "Goerli",
      ticker: "ETH",
      decimals: 18,
      rpcTarget: "https://rpc.ankr.com/eth_goerli",
      blockExplorer: "https://goerli.etherscan.io",
    });
  }

  async function switchNetwork() {
    try {
        await Moralis.switchNetwork("0x5"); // Chain ID for Goerli Test Network
    } catch (error) {
        console.error('Failed to switch network', error);
    }
}

async function reauthenticate() {
  console.log(chainId)

  const { message } = await Moralis.Cloud.run('requestMessage', {
    address: account,
    chain: parseInt(`${chainId}`, 16) ? 5 : 1,
    networkType: 'evm',
  });

  // Authenticate and login via parse
  await authenticate({
    signingMessage: message,
    throwOnError: true,
    provider: "web3Auth",
    clientId: process.env.REACT_APP_WEB3AUTH_CLIENT_ID,
    chainId: 1//parseInt("0x5", 16) 
  });
  //console.log(chainId)
}


  return (
    <VStack alignItems={'start'}>
      <Heading mb={8}>Home</Heading>
      <Textarea value={output} />

      <List>
        <ListItem mb={2}>
          <Button onClick={getNFTMetadata}>getNFTMetadata</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={getBlock}>getBlock</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={runContractFunction}>runContractFunction</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={resolveDomain}>resolveDomain</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={web3ApiVersion}>web3ApiVersion</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={getChainId}>getChainId</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={getWeb3Auth}>getWeb3Auth</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={switchChain}>switchChain</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={switchNetwork}>switchNetwork</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={addchain}>addchain</Button>
        </ListItem>
        <ListItem mb={2}>
          <Button onClick={reauthenticate}>reauthenticate</Button>
        </ListItem>
      </List>
    </VStack>
  );
};

export default Home;
