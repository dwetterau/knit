import axios from "axios";
import dedent from "dedent";
import { err, ok, Result } from "neverthrow";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const COMPLETION_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = "gpt-4o-mini";

function getOpenAIHeaders() {
  return {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  };
}

const IDENTIFIER_PROMPT = dedent`
    Person identifiers should refer to exactly one person and be unique across a database.
    Person identifiers should contain as much of the name of the individual as known.
    When useful, also include the relationship of the person to the user, such as "self" (for the user), "mother", or "brother".
`;

const fragmentsSchema = z.object({
  fragments: z.array(
    z.object({
      personIdentifiers: z.array(z.string()),
      fragment: z.string(),
    })
  ),
});

type FragmentsResponse = z.infer<typeof fragmentsSchema>;
type Fragments = FragmentsResponse["fragments"];

export async function computeFragmentsAsync(
  content: string
): Promise<Result<Fragments, string>> {
  const messages = [
    {
      role: "system",
      content: dedent`
        You are an expert at breaking up a message sent by a user into fragments, and filing those fragments
        into a database organized by person.

        When given content, first identify the person or people mentioned in the content, including the speaker if they are a subject.
        Then, create fragments of the input content for filing into a database that is organized by individual people.

        If multiple people are mentioned, you might need to output multiple fragments to accurately specify which
        parts of the content are associated with which people. 
        Do not output duplicate fragments for multiple people, instead return multiple person identifiers.

        Do not hallucinate or embellish any content. Fragments should be direct quotes from the input content, with 
        minimal adjustment for grammatical clarity when needed.

        All fragments should include identfiers for the people associated with them.
        ${IDENTIFIER_PROMPT}
        `,
    },
    {
      role: "user",
      content: `Break up the following content into fragments:\n${content}`,
    },
  ];

  try {
    const response = await axios.post(
      COMPLETION_API_URL,
      {
        model: OPENAI_MODEL,
        messages,
        tools: [
          {
            type: "function",
            function: {
              name: "outputFragments",
              description: "Store fragments of content organized by person.",
              parameters: zodToJsonSchema(fragmentsSchema),
            },
          },
        ],
        max_tokens: 10000,
        temperature: 0.1,
        stream: false,
      },
      {
        headers: getOpenAIHeaders(),
      }
    );
    const data = response.data;
    const toolCalls = data.choices[0]?.message?.tool_calls;
    for (const toolCall of toolCalls) {
      const args = fragmentsSchema.parse(
        JSON.parse(toolCall.function.arguments)
      );
      return ok(args.fragments);
    }
    return ok([]);
  } catch (error) {
    console.log("computeFragmentsAsync error", error);
    return err(`${error}`);
  }
}
