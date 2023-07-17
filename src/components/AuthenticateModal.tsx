/*eslint-disable*/
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  VStack,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { useMoralis } from 'react-moralis';
import Moralis from 'moralis-v1';
//import { Web3Auth } from "@web3auth/modal";
//@ts-ignore
import Web3AuthConnector from './web3AuthConnector';


interface AuthenticateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthenticateModal = ({ isOpen, onClose }: AuthenticateModalProps) => {
  const { authenticate, enableWeb3 } = useMoralis();

  const [authError, setAuthError] = useState<null | Error>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
/*
  const handleAuth2 = async (provider: 'metamask' | 'walletconnect' | 'magicLink' | 'web3Auth' = 'metamask') => {
    //Initialize within your constructor
    const web3auth = new Web3Auth({
    clientId: process.env.REACT_WEB3AUTH_CLIENT_ID!, // Get your Client ID from Web3Auth Dashboard
    chainConfig: {
      chainNamespace: "eip155",
      chainId: "0x1", // Please use 0x5 for Goerli Testnet
    },
  });

  await web3auth.initModal();
  await web3auth.connect();
  }
*/
  /**
   * 1) Connect to a Evm
   * 2) Request message to sign using the Moralis Auth Api of moralis (handled on server)
   * 3) Login via parse using the signed message (verification handled on server via Moralis Auth Api)
   */
  const handleAuth = async (provider: 'metamask' | 'walletconnect' | 'magicLink' | 'web3Auth' = 'metamask') => {
    try {
      setAuthError(null);
      setIsAuthenticating(true);
      console.log(process.env.REACT_WEB3AUTH_CLIENT_ID)
      // Enable web3 to get user address and chain
      await enableWeb3({ 
        throwOnError: true, 
        //provider, 
        //@ts-ignore
        connector: Web3AuthConnector,
        //@ts-ignore
        chainId: "0x1",  // add this line
        clientId: process.env.REACT_APP_WEB3AUTH_CLIENT_ID
      });
      const { account, chainId } = Moralis;
      console.log(chainId)

      if (!account) {
        throw new Error('Connecting to chain failed, as no connected account was found');
      }
      if (!chainId) {
        throw new Error('Connecting to chain failed, as no connected chain was found');
      }

      // Get message to sign from the auth api
      const { message } = await Moralis.Cloud.run('requestMessage', {
        address: account,
        chain: parseInt(chainId, 16),
        networkType: 'evm',
      });

      // Authenticate and login via parse
      await authenticate({
        signingMessage: message,
        throwOnError: true,
        //provider: provider,
        //@ts-ignore
        connector: Web3AuthConnector,
        clientId: process.env.REACT_APP_WEB3AUTH_CLIENT_ID,
      });
      
    
      console.log(Moralis.connector)
      console.log(await Moralis.connector.getUser())

      onClose();
    } catch (error) {
      setAuthError(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Web3 Authentication</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {authError && (
            <Alert status="error">
              <AlertIcon />
              <AlertTitle>Error: {authError.name}</AlertTitle>
              <AlertDescription>{authError.message}</AlertDescription>
            </Alert>
          )}
          <VStack alignItems="stretch">
            <Button onClick={() => handleAuth('metamask')} disabled={isAuthenticating}>
              Metamask
            </Button>
            <Button onClick={() => handleAuth('walletconnect')} disabled={isAuthenticating}>
              WalletConnect
            </Button>
            <Button onClick={() => handleAuth('magicLink')} disabled={isAuthenticating}>
              MagicLink
            </Button>
            <Button onClick={() => handleAuth('web3Auth')} disabled={isAuthenticating}>
              Web3Auth
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
