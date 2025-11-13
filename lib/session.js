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
    const response = await fetch(`${API_BASE_URL}/api/graphql`, {
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

async function getUserIdByEmail(email) {
  const query = `
    query ($email: String!) {
      users(where: { email: { equals: $email } }) {
        id
        email
      }
    }
  `;

  const variables = { email };

  const res = await fetch(`${API_BASE_URL}/api/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  const users = json?.data?.users || [];
  return users.length > 0 ? users[0].id : null;
}
