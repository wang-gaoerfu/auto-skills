import { NextRequest, NextResponse } from 'next/server';

const API_URL = 'https://sqpmnrpf6b.coze.site/stream_run';
const API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjVkMzliMWFhLWNkMTEtNDc2YS04MzNmLWJkYzFkODhlNWQ4NiJ9.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIk1yT0xLeHh1SEhqTWhSa291Z0YyYUZFeDJaRWcwQ2NZIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzcwMzA1NTc0LCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjAzMjA2MTczMzE1MDM5Mjc0Iiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjAzNDA0NTQ2NDMzMzUxNjgwIn0.jHBIt_8xs68lOmX9TkWzXZJbrGZuWXiVp8mPGxfmxTxdSCrv1QYtGJhI2sU5OJSVWNM370W8lhhdqb2bPLzQN4JejPTo5aOm6or8Tt1u2TM24pwNr_R73CRMI8tLgdYyhc3sTuB5gdgShJMJHc4y1ZA6RN-qq8-AxiXfsF9AgNfUhEIcv-YoWv7V6An-EY9Uqphgej_RarI2u2zqGQi_O-QVXvYhTU9IZIIxggvwdK1V-tqOJ_rMwMqnw2vaQSlyh9YVTllsgpiJZ9cVNDoA3Tv-8Ikj8_BFahT30Yd_4B9VMoeCwAplqRnH2xJn_iy9gAbiighnzA1QEeL0tyX6MA';
const SESSION_ID = '-_K4h_MqxJFDKGJzA-xct';
const PROJECT_ID = 7603199597850296339;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          query: {
            prompt: [
              {
                type: 'text',
                content: {
                  text: message
                }
              }
            ]
          }
        },
        type: 'query',
        session_id: SESSION_ID,
        project_id: PROJECT_ID
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      return NextResponse.json(
        { error: `API request failed: ${response.status}` },
        { status: response.status }
      );
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const reader = response.body?.getReader();

    if (!reader) {
      return NextResponse.json({ error: 'No response body' }, { status: 500 });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (data) {
                  try {
                    // 尝试解析数据，如果是流式响应，直接转发
                    const parsed = JSON.parse(data);
                    
                    // 提取content字段
                    if (parsed.content) {
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ content: parsed.content })}\n\n`)
                      );
                    }
                  } catch (e) {
                    // 如果不是JSON，直接转发
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  }
                }
              } else if (line.trim()) {
                // 对于其他格式的行，直接转发
                controller.enqueue(encoder.encode(`data: ${line}\n\n`));
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
