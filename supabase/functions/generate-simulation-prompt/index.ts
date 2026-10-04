import "@supabase/functions-js/edge-runtime.d.ts";
import { json, preflight } from "../_shared/cors.ts";
import { requireUser, errorResponse, HttpError } from "../_shared/guard.ts";
// Admins only. Builds a prompt string locally; no model call, so no usage limit.
// (Previously wrapped in withSupabase({ auth: ["publishable", "secret"] }), which
// accepted the public publishable key, i.e. any visitor.)
export default {
  fetch: async (req: Request)=>{
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return preflight(req);
    }
    try {
      await requireUser(req, { admin: true });
      const { topic, details, uiTheme, animationArchitecture, interactionType, dimension } = await req.json();
      // Ensure topic is provided
      if (!topic) {
        throw new HttpError(400, "Topic is required.");
      }
      // Format architecture specifics
      let architectureDescription = "";
      switch(animationArchitecture){
        case "physics":
          architectureDescription = "Physics-based environment with realistic gravity, collisions, and forces.";
          break;
        case "math":
          architectureDescription = "Mathematical graphing environment with plotted data curves, coordinates, and axes.";
          break;
        case "node":
          architectureDescription = "Node-based grid layout allowing for draggable connections and circuit-like structures.";
          break;
        case "dom":
          architectureDescription = "Standard structured layout focusing on UI elements and visual transitions.";
          break;
        default:
          architectureDescription = "Dynamic interactive layout.";
      }
      // Format theme specifics
      let themeDescription = "";
      switch(uiTheme){
        case "modern":
          themeDescription = "Scientific & Modern (Slate, Emerald, Indigo) - Clean, professional, and readable.";
          break;
        case "playful":
          themeDescription = "Playful & Primary - Vibrant colors, rounded edges, kid-friendly aesthetic.";
          break;
        case "dark":
          themeDescription = "Cyberpunk / Dark Mode - Deep dark backgrounds with neon glowing accents.";
          break;
        case "contrast":
          themeDescription = "High Contrast - Maximum readability and accessibility.";
          break;
        default:
          themeDescription = "Clean and modern visual aesthetic.";
      }
      // Format interaction specifics
      let interactionDescription = "";
      switch(interactionType){
        case "slider":
          interactionDescription = "Control panel with sliders and input fields that update the simulation dynamically in real-time.";
          break;
        case "drag":
          interactionDescription = "Drag & Drop interface allowing the student to physically manipulate elements on the screen.";
          break;
        case "click":
          interactionDescription = "Click & Reveal approach for step-by-step interactive walkthroughs.";
          break;
        default:
          interactionDescription = "Intuitive interactive controls.";
      }
      const generatedPrompt = `Simulation Blueprint: ${topic}

### Core Objectives
${details || 'Create an intuitive and highly engaging educational experience that clearly demonstrates the core concepts.'}

### Visual & Stylistic Approach
- Theme: ${themeDescription}
- Dimension: ${dimension} environment.

### Interaction & Behavior
- User Controls: ${interactionDescription}
- Environment Style: ${architectureDescription}`;
      return json(req, {
        prompt: generatedPrompt
      });
    } catch (error) {
      return errorResponse(req, error);
    }
  }
};
