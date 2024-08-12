export default {
	async fetch(request, env) {
	  if (request.method === 'OPTIONS') {
		return handleOptions(request);
	  }
  
	  const setCache = (key, data) => env.MESSAGES.put(key, data);
	  const getCache = key => env.MESSAGES.get(key);
	  const listKeys = async () => {
		const list = await env.MESSAGES.list();
		return list.keys;
	  };
  
	  async function getMessages() {
		const keys = await listKeys();
		const messages = await Promise.all(keys.map(async key => {
		  const value = await getCache(key.name);
		  return { id: key.name, ...JSON.parse(value) };
		}));
  
		return new Response(JSON.stringify({ messages }), {
		  headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		  }
		});
	  }
  
	  async function updateMessage(request) {
		const body = await request.json();
		const message = body.messages[0];
		const messageId = message.id;
		const ip = request.headers.get('CF-Connecting-IP');
  
		try {
		  // Retrieve existing message to check IP addresses
		  const existingMessage = await getCache(messageId);
		  if (existingMessage) {
			const existingData = JSON.parse(existingMessage);
			if (existingData.ip !== ip) {
			  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 403,
				headers: {
				  'Access-Control-Allow-Origin': '*'
				}
			  });
			}
		  }
  
		  // Store the IP address with the message
		  message.ip = ip;
  
		  await setCache(messageId, JSON.stringify(message));
		  return new Response(JSON.stringify(message), {
			status: 200,
			headers: {
			  'Access-Control-Allow-Origin': '*'
			}
		  });
		} catch (err) {
		  return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: {
			  'Access-Control-Allow-Origin': '*'
			}
		  });
		}
	  }
  
	  function handleOptions(request) {
		return new Response(null, {
		  headers: {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		  }
		});
	  }
  
	  if (request.method === 'PUT') {
		return updateMessage(request);
	  }
	  return getMessages();
	}
  };
  