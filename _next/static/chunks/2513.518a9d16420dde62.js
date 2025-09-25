"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[2513],{85744:function(e,t,n){},6172:function(e,t,n){n.d(t,{SIWEController:function(){return o},getDidAddress:function(){return s.NmC},getDidChainId:function(){return s.ZzI}});var i=n(10488);n(62043);var s=n(75326),r=n(21675),a=n(48505);let l=(0,a.sj)({status:"uninitialized"}),o={state:l,subscribeKey:(e,t)=>(0,r.VW)(l,e,t),subscribe:e=>(0,a.Ld)(l,()=>e(l)),_getClient(){if(!l._client)throw Error("SIWEController client not set");return l._client},async getNonce(e){let t=this._getClient(),n=await t.getNonce(e);return this.setNonce(n),n},async getSession(){try{let e=this._getClient(),t=await e.getSession();return t&&(this.setSession(t),this.setStatus("success")),t}catch{return}},createMessage(e){let t=this._getClient().createMessage(e);return this.setMessage(t),t},async verifyMessage(e){let t=this._getClient();return await t.verifyMessage(e)},async signIn(){let e=this._getClient();return await e.signIn()},async signOut(){let e=this._getClient();await e.signOut(),this.setStatus("ready"),this.setSession(void 0),e.onSignOut?.()},onSignIn(e){let t=this._getClient();t.onSignIn?.(e)},onSignOut(){let e=this._getClient();e.onSignOut?.()},setSIWEClient(e){l._client=(0,a.iH)(e),l.status="ready",i.OptionsController.setIsSiweEnabled(e.options.enabled)},setNonce(e){l.nonce=e},setStatus(e){l.status=e},setMessage(e){l.message=e},setSession(e){l.session=e,l.status=e?"success":"ready"}};var c=n(71750),u=n(2577),g=(0,u.iv)`
  :host {
    display: flex;
    justify-content: center;
    gap: var(--wui-spacing-2xl);
  }

  wui-visual-thumbnail:nth-child(1) {
    z-index: 1;
  }
`;let d=class extends u.oi{constructor(){super(...arguments),this.dappImageUrl=i.OptionsController.state.metadata?.icons,this.walletImageUrl=i.MO.getConnectedWalletImageUrl()}firstUpdated(){let e=this.shadowRoot?.querySelectorAll("wui-visual-thumbnail");e?.[0]&&this.createAnimation(e[0],"translate(18px)"),e?.[1]&&this.createAnimation(e[1],"translate(-18px)")}render(){return(0,u.dy)`
      <wui-visual-thumbnail
        ?borderRadiusFull=${!0}
        .imageSrc=${this.dappImageUrl?.[0]}
      ></wui-visual-thumbnail>
      <wui-visual-thumbnail .imageSrc=${this.walletImageUrl}></wui-visual-thumbnail>
    `}createAnimation(e,t){e.animate([{transform:"translateX(0px)"},{transform:t}],{duration:1600,easing:"cubic-bezier(0.56, 0, 0.48, 1)",direction:"alternate",iterations:1/0})}};d.styles=g,d=function(e,t,n,i){var s,r=arguments.length,a=r<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,n):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,n,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(a=(r<3?s(a):r>3?s(t,n,a):s(t,n))||a);return r>3&&a&&Object.defineProperty(t,n,a),a}([(0,c.customElement)("w3m-connecting-siwe")],d);var f=n(42478),h=n(33785),w=function(e,t,n,i){var s,r=arguments.length,a=r<3?t:null===i?i=Object.getOwnPropertyDescriptor(t,n):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,n,i);else for(var l=e.length-1;l>=0;l--)(s=e[l])&&(a=(r<3?s(a):r>3?s(t,n,a):s(t,n))||a);return r>3&&a&&Object.defineProperty(t,n,a),a};let p=class extends u.oi{constructor(){super(...arguments),this.dappName=i.OptionsController.state.metadata?.name,this.isSigning=!1}render(){return this.onRender(),(0,u.dy)`
      <wui-flex justifyContent="center" .padding=${["2xl","0","xxl","0"]}>
        <w3m-connecting-siwe></w3m-connecting-siwe>
      </wui-flex>
      <wui-flex
        .padding=${["0","4xl","l","4xl"]}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="paragraph-500" align="center" color="fg-100"
          >${this.dappName??"Dapp"} needs to connect to your wallet</wui-text
        >
      </wui-flex>
      <wui-flex
        .padding=${["0","3xl","l","3xl"]}
        gap="s"
        justifyContent="space-between"
      >
        <wui-text variant="small-400" align="center" color="fg-200"
          >Sign this message to prove you own this wallet and proceed. Canceling will disconnect
          you.</wui-text
        >
      </wui-flex>
      <wui-flex .padding=${["l","xl","xl","xl"]} gap="s" justifyContent="space-between">
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="neutral"
          @click=${this.onCancel.bind(this)}
          data-testid="w3m-connecting-siwe-cancel"
        >
          Cancel
        </wui-button>
        <wui-button
          size="lg"
          borderRadius="xs"
          fullWidth
          variant="main"
          @click=${this.onSign.bind(this)}
          ?loading=${this.isSigning}
          data-testid="w3m-connecting-siwe-sign"
        >
          ${this.isSigning?"Signing...":"Sign"}
        </wui-button>
      </wui-flex>
    `}onRender(){o.state.session&&i.IN.close()}async onSign(){this.isSigning=!0,i.Xs.sendEvent({event:"CLICK_SIGN_SIWE_MESSAGE",type:"track"});try{o.setStatus("loading");let e=await o.signIn();return o.setStatus("success"),i.Xs.sendEvent({event:"SIWE_AUTH_SUCCESS",type:"track"}),e}catch(e){return i.AccountController.state.preferredAccountType===h.y_.ACCOUNT_TYPES.SMART_ACCOUNT?i.SnackController.showError("This application might not support Smart Accounts"):i.SnackController.showError("Signature declined"),o.setStatus("error"),i.Xs.sendEvent({event:"SIWE_AUTH_ERROR",type:"track"})}finally{this.isSigning=!1}}async onCancel(){let{isConnected:e}=i.AccountController.state;e?(await i.ConnectionController.disconnect(),i.IN.close()):i.RouterController.push("Connect"),i.Xs.sendEvent({event:"CLICK_CANCEL_SIWE",type:"track"})}};w([(0,f.SB)()],p.prototype,"isSigning",void 0),w([(0,c.customElement)("w3m-connecting-siwe-view")],p)},35725:function(e,t,n){var i=n(2737);function s(e,t,n,i){return{name:e,prefix:t,encoder:{name:e,prefix:t,encode:n},decoder:{decode:i}}}s("utf8","u",e=>"u"+new TextDecoder("utf8").decode(e),e=>new TextEncoder().encode(e.substring(1))),s("ascii","a",e=>{let t="a";for(let n=0;n<e.length;n++)t+=String.fromCharCode(e[n]);return t},e=>{let t=function(e=0){if(null!=globalThis.Buffer&&null!=globalThis.Buffer.allocUnsafe){var t;return t=globalThis.Buffer.allocUnsafe(e),null!=globalThis.Buffer?new Uint8Array(t.buffer,t.byteOffset,t.byteLength):t}return new Uint8Array(e)}((e=e.substring(1)).length);for(let n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}),i.gh.base16,i.gh}}]);