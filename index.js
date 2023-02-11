import { getEventHash, signEvent } from "nostr-tools";

// 1. User created an identity/profile in their NIP-07 compatible extension.
//    This is a "delegated" profile, or a delagatee. The extension would store the
//    delegators pubkey and the delegation tag associated with the delegatee.

const IDENTITY = {
  delegatorPubKey:
    "f501261fcd2e72439a121c95a5d377635843d6f8b5b3807cc279feccfa4e80f3",
  delegateePrivKey:
    "a5f812c4b9e716ee041c80967ae2c9f42c988000df37be6e07565e2ce8bb7a71",
  tag: [
    "delegation",
    "f501261fcd2e72439a121c95a5d377635843d6f8b5b3807cc279feccfa4e80f3",
    "kind=1&created_at>1676073600&created_at<1678492800",
    "961fa9b7f8b9757b1ae6b1d5c22c3b0e5945a211bd0ad1be61414f5f01a606966e3de2d06d832de5126f995b068bcf2ef3d5a4528e88e28e470ace9d296b9d19",
  ],
};

// 2. The client visits a web client, and the extension injects the NIP-05 functions into the webpage.

window.nostr = {
  async getPublicKey() {
    return IDENTITY.delegatorPubKey;
  },

  async signEvent(event) {
    event.tags.push(IDENTITY.tag);
    event.id = getEventHash(event);
    event.sig = signEvent(event, IDENTITY.delegateePrivKey);
    event.pubkey = this.getPublicKey(IDENTITY.delegateePrivKey);
    return event;
  },

  // ... other function elided here
};

// 3. The user logs into the web client, which makes a request to the NIP-07 extension.
//    Instead of returning the delegatee's pubkey, it returns the delegator's pubkey, so that
//    the user may see their normal feed.

const client = {
  async login() {
    let pk = await window.nostr.getPublicKey();
    storePk(pk);
    loadUserFeed(pk);

    // ..etc
  },
};

client.login();

// 4. The user makes a post on the client. The client constructs a normal Kind 1 event, using the
//    delegatee's pubkey, as normal. After calling the `signEvent` method, the client only needs
//    to check for the presence of a delegation tag to know how to handle this.

client.transmitNote = async function (content) {
  const pubkey = getPk();
  let event = { kind: 1, tags: [], content, created_at: now(), pubkey };
  event.id = getEventHash(event);

  const signedEvent = await window.nostr.signEvent(event);
  const delegation = signEvent.tags.find(t => t[0] === 'delegation');

  if (delegation) {
    if (validDelegation(delegation)) {
      event.id = signedEvent.id;
      event.pubkey = signedEvent.pubkey
      event.sig = signedEvent.sig;
      event.tags.push(delegation);
    } else {
      throw new Error('Invalid delegation found');
    }
  } else {
    // ... normal event signing flow
  }

  sendToRelays(event);
};

await transmiteNote("hello world");
