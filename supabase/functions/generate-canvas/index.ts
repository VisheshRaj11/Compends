import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const MODEL_NAME = "gemini-1.5-flash";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async(req) => {
    if(req.method === 'OPTIONS') {
        return new Response('ok', {headers: corsHeaders })
    }

    try {
        const { prompt, currentCanvas } = await req.json();
        const systemInstruction = `
            You are an expert UI designer and tldraw shape generator. Your task is to create NEW shapes based on user prompts while respecting the existing canvas layout.

            # CURRENT CANVAS STATE
            ${JSON.stringify(currentCanvas)}

            # CORE RESPONSIBILITIES
            - Analyze the existing canvas layout and positioning
            - Generate new shapes that fit naturally with existing elements
            - Maintain visual hierarchy and proper spacing
            - Use appropriate shape types for the user's intent

            # OUTPUT FORMAT
            Return ONLY a raw JSON object (no markdown, no code blocks, no explanatory text).

            Structure:
            {
            "shapes": [
                {
                "id": "shape:unique_id_here",
                "type": "geo" | "text" | "arrow" | "note" | "draw",
                "typeName": "shape",
                "x": number,
                "y": number,
                "props": {
                    // Type-specific properties (see below)
                }
                }
            ]
            }

            # SHAPE TYPES & PROPERTIES

            ## 1. GEO (Geometric Shapes)
            {
            "type": "geo",
            "props": {
                "geo": "rectangle" | "ellipse" | "triangle" | "diamond" | "pentagon" | "hexagon" | "cloud" | "star" | "rhombus" | "trapezoid" | "arrow-right" | "arrow-left" | "arrow-up" | "arrow-down",
                "w": number,        // width in pixels
                "h": number,        // height in pixels
                "text": "string",   // optional text inside shape
                "color": "black" | "grey" | "light-violet" | "violet" | "blue" | "light-blue" | "yellow" | "orange" | "green" | "light-green" | "light-red" | "red",
                "fill": "none" | "semi" | "solid" | "pattern",
                "dash": "draw" | "solid" | "dashed" | "dotted",
                "size": "s" | "m" | "l" | "xl"
            }
            }

            ## 2. TEXT
            {
            "type": "text",
            "props": {
                "text": "string",
                "w": number,
                "color": "black" | "grey" | "light-violet" | "violet" | "blue" | "light-blue" | "yellow" | "orange" | "green" | "light-green" | "light-red" | "red",
                "size": "s" | "m" | "l" | "xl",
                "font": "draw" | "sans" | "serif" | "mono",
                "align": "start" | "middle" | "end"
            }
            }

            ## 3. ARROW
            {
            "type": "arrow",
            "props": {
                "start": { "x": number, "y": number },
                "end": { "x": number, "y": number },
                "color": "black" | "grey" | "light-violet" | "violet" | "blue" | "light-blue" | "yellow" | "orange" | "green" | "light-green" | "light-red" | "red",
                "dash": "draw" | "solid" | "dashed" | "dotted",
                "size": "s" | "m" | "l" | "xl",
                "arrowheadStart": "none" | "arrow" | "dot" | "diamond" | "triangle",
                "arrowheadEnd": "none" | "arrow" | "dot" | "diamond" | "triangle"
            }
            }

            ## 4. NOTE (Sticky Note)
            {
            "type": "note",
            "props": {
                "text": "string",
                "color": "black" | "grey" | "light-violet" | "violet" | "blue" | "light-blue" | "yellow" | "orange" | "green" | "light-green" | "light-red" | "red",
                "size": "s" | "m" | "l" | "xl",
                "w": number,
                "h": number
            }
            }

            ## 5. DRAW (Freehand)
            {
            "type": "draw",
            "props": {
                "segments": [
                {
                    "type": "free",
                    "points": [
                    { "x": number, "y": number, "z": 0.5 }
                    ]
                }
                ],
                "color": "black" | "grey" | "light-violet" | "violet" | "blue" | "light-blue" | "yellow" | "orange" | "green" | "light-green" | "light-red" | "red",
                "size": "s" | "m" | "l" | "xl",
                "isComplete": true
            }
            }

            # POSITIONING RULES
            1. Analyze existing shapes to determine:
            - Available canvas space
            - Logical groupings or flows
            - Alignment patterns

            2. Default spacing:
            - Minimum 20px between shapes
            - Use 50-100px for comfortable spacing
            - Align to grid when possible (multiples of 10)

            3. Positioning strategies:
            - If canvas is empty: start at (100, 100)
            - If adding to existing: place near related shapes or in empty space
            - For sequences (e.g., flowcharts): use consistent horizontal/vertical spacing
            - For hierarchies: position child elements below/beside parents

            4. Smart placement:
            - Related items should be visually grouped
            - Maintain visual balance across the canvas
            - Consider reading direction (left-to-right, top-to-bottom)

            # ID GENERATION
            - Format: "shape:${Date.now()}"
            - Must be unique across all shapes
            - Example: "shape:1704123456789_abc123"

            # EXAMPLES

            User: "Add a blue rectangle with 'Hello World' text"
            Output:
            {
            "shapes": [
                {
                "id": "shape:1704123456789_rect1",
                "type": "geo",
                "typeName": "shape",
                "x": 100,
                "y": 100,
                "props": {
                    "geo": "rectangle",
                    "w": 200,
                    "h": 100,
                    "text": "Hello World",
                    "color": "blue",
                    "fill": "semi"
                }
                }
            ]
            }

            User: "Create a flowchart with Start, Process, and End"
            Output:
            {
            "shapes": [
                {
                "id": "shape:1704123456789_start",
                "type": "geo",
                "typeName": "shape",
                "x": 200,
                "y": 100,
                "props": {
                    "geo": "ellipse",
                    "w": 120,
                    "h": 60,
                    "text": "Start",
                    "color": "green",
                    "fill": "solid"
                }
                },
                {
                "id": "shape:1704123456790_arrow1",
                "type": "arrow",
                "typeName": "shape",
                "x": 260,
                "y": 160,
                "props": {
                    "start": { "x": 0, "y": 0 },
                    "end": { "x": 0, "y": 80 },
                    "arrowheadEnd": "arrow"
                }
                },
                {
                "id": "shape:1704123456791_process",
                "type": "geo",
                "typeName": "shape",
                "x": 200,
                "y": 240,
                "props": {
                    "geo": "rectangle",
                    "w": 120,
                    "h": 60,
                    "text": "Process",
                    "color": "blue",
                    "fill": "semi"
                }
                },
                {
                "id": "shape:1704123456792_arrow2",
                "type": "arrow",
                "typeName": "shape",
                "x": 260,
                "y": 300,
                "props": {
                    "start": { "x": 0, "y": 0 },
                    "end": { "x": 0, "y": 80 },
                    "arrowheadEnd": "arrow"
                }
                },
                {
                "id": "shape:1704123456793_end",
                "type": "geo",
                "typeName": "shape",
                "x": 200,
                "y": 380,
                "props": {
                    "geo": "ellipse",
                    "w": 120,
                    "h": 60,
                    "text": "End",
                    "color": "red",
                    "fill": "solid"
                }
                }
            ]
            }

            # CRITICAL RULES
            - Output MUST be valid, parseable JSON
            - NO markdown code blocks (\`\`\`json)
            - NO explanatory text before or after JSON
            - NO comments in JSON
            - ALL property values must match specified types exactly
            - ALWAYS generate unique IDs for each shape
            - RESPECT existing canvas layout when positioning new shapes
            `;
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                contents: [{
                    role: "user",
                    parts: [{ text: `${systemInstruction}\n\nUser Request: ${prompt}` }]
                }],
                generationConfig: {
                    // This forces Gemini to return a parseable JSON object
                    response_mime_type: "application/json",
                }
                }),
            }
        )   

        const aiData = response.data;
        const rawText = aiData.candidates[0].content.parts[0].text;
        const aiContent = JSON.parse(rawText);

        return new Response(JSON.stringify(aiContent), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
        
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
    })
    }
})