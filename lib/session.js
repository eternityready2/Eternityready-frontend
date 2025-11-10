function setSession(session) {
  localStorage.setItem('session', session);
}

function getSession() {
  return localStorage.getItem("session");
}

async function getUserIdFromSessionToken(sessionToken) {
  const query = `
    query {
      authenticatedItem {
        ... on User {
          id
          email
          firstName
          lastName
        }
      }
    }
  `;

  try {
    const response = await fetch('http://127.0.0.1:3000/api/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ query }),
    });

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return null;
    }
    console.log(result);

    const user = result.data?.authenticatedItem;
    if (!user) {
      console.warn('No authenticated user found for the given session token');
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Network or other error:', error);
    return null;
  }
}
