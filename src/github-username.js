export const validGithubUsername=s=>typeof s==='string'&&/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(s);
