/*eslint-disable*/
import Moralis from 'moralis-v1';
import { ethers } from 'ethers';
//import verifyChainId from '../utils/verifyChainId';
import { WALLET_ADAPTERS } from '@web3auth/base';
import { TorusWalletConnectorPlugin } from "@web3auth/torus-wallet-connector-plugin";

export default class Web3AuthConnector extends Moralis.AbstractWeb3Connector {
  type = 'web3Auth';

  connect = (web3auth) => {
    return new Promise((resolve, reject) => {
      const subscribeAuthEvents = (web3auth) => {
        web3auth.loginModal.on('MODAL_VISIBILITY', async (visibility) => {
          if (!visibility) {
            reject(new Error('Web3Auth: User closed login modal.'));
          }
        });
      };

      subscribeAuthEvents(web3auth);

      web3auth.connect().then(resolve).catch(reject);
    });
  };

  activate = async ({
    chainId = '0x1',
    clientId,
    theme,
    appLogo,
    loginMethodsOrder,
  } = {}) => {
    // Checking that all params are given
    if (!clientId) {
      throw new Error('"clientId" not provided, please provide clientId');
    }

    // Initalizing Web3Auth and getting constants
    let Web3Auth;
    try {
      Web3Auth = require('@web3auth/modal')?.Web3Auth;
    } catch {
      // Do Nothing Individual Checks are done below
    }

    // Check if user is using CDN to import
    if (!Web3Auth) {
      Web3Auth = window?.Web3auth?.Web3Auth;
    }

    // Error checking for if library is not installed
    if (!Web3Auth) {
      throw new Error('"@web3auth/web3auth" not installed, please install');
    }

    // Build config
    const ethChainConfig = {
      chainNamespace: 'eip155',
      chainId: chainId,
    };
    // Build Web3Auth
    let web3auth;
    try {
      web3auth = new Web3Auth({
        chainConfig: ethChainConfig,
        uiConfig: {
          theme: theme ?? 'dark',
          appLogo:
            appLogo ??
            'https://moralis.io/wp-content/uploads/2021/05/moralisWhiteLogo.svg',
          loginMethodsOrder,
        },
        clientId: clientId,
      });

       // Add Torus Wallet Connector Plugin
       const torusPlugin = new TorusWalletConnectorPlugin({
        torusWalletOpts: {},
        walletInitOptions: {
          whiteLabel: {
            theme: { isDark: true, colors: { primary: "#00a8ff" } },
            logoDark: "https://web3auth.io/images/w3a-L-Favicon-1.svg",
            logoLight: "https://web3auth.io/images/w3a-D-Favicon-1.svg",
          },
          //useWalletConnect: true,
          showTorusButton: true,
          enableLogging: true,
        },
      });
      await web3auth.addPlugin(torusPlugin);
      

    } catch {
      // Do Nothing error checked below
    }
    if (!web3auth) {
      throw new Error(
        'Could not connect via Web3Auth, error during initializing Web3Auth'
      );
    }

    // Authenticate
    await web3auth.initModal({
      modalConfig: {
        [WALLET_ADAPTERS.OPENLOGIN]: {
          loginMethods: {
            // change based on what you want to show
            google: {
              showOnModal: true,
            },
            facebook: {
              showOnModal: false,
            },
            twitter: {
              showOnModal: false,
            },
          },
          // setting it to false will hide all social login methods from modal.
          showOnModal: true,
        },
      },
    });
    let provider = null;
    provider = await this.connect(web3auth);

    if (!provider) {
      throw new Error(
        'Could not connect via Web3Auth, error in connecting to provider'
      );
    }

    // Gather User data
    try {
      const isSocialLogin = web3auth?.provider ? false : true;
      const ether = new ethers.providers.Web3Provider(
        web3auth?.provider ? web3auth.provider : web3auth
      );

      const signer = ether.getSigner();
      const values = await Promise.all([
        ether.getNetwork(),
        signer.getAddress(),
      ]);
      const providerChainId = values[0].chainId;

      this.account = values[1].toLocaleLowerCase();
      this.chainId = `0x${providerChainId.toString(16)}`;
      this.provider = isSocialLogin ? ether : web3auth?.provider;

      this.web3Instance = web3auth;
      this.subscribeToEvents(this.provider);
      return {
        chainId: this.chainId,
        account: this.account,
        provider: this.provider,
      };
    } catch {
      throw new Error(
        'Could not connect via Web3Auth, error while authenticating'
      );
    }
  };

  deactivate = async () => {
    this.unsubscribeToEvents(this.provider);
    if (this.web3Instance) {
      await this.web3Instance.logout();
    }
    this.account = null;
    this.chainId = null;
    this.provider = null;
  };

}