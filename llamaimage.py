import streamlit as st
import ollama
from diffusers import StableDiffusionPipeline
import torch
import os
from io import BytesIO

# Static password
PASSWORD = "5603"

# Define paths on E: drive
MODEL_DIR = "E:\\models"
OLLAMA_MODEL_PATH = os.path.join(MODEL_DIR, "ollama")
DIFFUSERS_CACHE = os.path.join(MODEL_DIR, "diffusers_cache")

# Ensure directories exist
os.makedirs(OLLAMA_MODEL_PATH, exist_ok=True)
os.makedirs(DIFFUSERS_CACHE, exist_ok=True)

# Set environment variable for ollama to use custom path
os.environ["OLLAMA_MODELS"] = OLLAMA_MODEL_PATH

def login():
    st.title("Login to AI Image Generator")
    password = st.text_input("Password", type="password", placeholder="Enter your password")

    if st.button("Login"):
        if password == PASSWORD:
            st.session_state["authenticated"] = True
            st.rerun()  
        else:
            st.error("Invalid password!")

# Function to check and download LLaMA model if not present
def ensure_llama_model():
    model_name = "llama3.1:8b"
    model_path = os.path.join(OLLAMA_MODEL_PATH, f"{model_name}.gguf")
    if not os.path.exists(model_path):
        with st.spinner(f"Downloading {model_name} to {OLLAMA_MODEL_PATH}..."):
            ollama.pull(model_name)  # Downloads the model to the specified directory
    return model_name

# Function to check and load Stable Diffusion model
def ensure_stable_diffusion_model():
    model_id = "runwayml/stable-diffusion-v1-5"
    model_path = os.path.join(DIFFUSERS_CACHE, model_id.replace("/", "_"))
    
    if not os.path.exists(model_path):
        with st.spinner(f"Downloading Stable Diffusion model to {DIFFUSERS_CACHE}..."):
            pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float32, cache_dir=DIFFUSERS_CACHE)
            pipe.save_pretrained(model_path)
    else:
        pipe = StableDiffusionPipeline.from_pretrained(model_path, torch_dtype=torch.float32)
    
    pipe = pipe.to("cpu")  # Ensure it runs on CPU
    pipe.enable_attention_slicing()  # Optimize for CPU memory usage
    return pipe

# Function to generate text description using LLaMA
def generate_description(prompt, model_name):
    response = ollama.chat(
        model=model_name,
        messages=[{"role": "user", "content": f"Generate a vivid description for an image based on this prompt: {prompt}"}]
    )
    return response['message']['content']

# Function to generate image
def generate_image_from_description(description, pipe):
    image = pipe(description, num_inference_steps=20).images[0]
    return image

def generate_image():
    st.set_page_config(page_title="AI Image Generator", page_icon="🎨")
    st.title("🎨 AI Image Generator")
    st.write("Enter a description, or use the default prompt to generate an image!")

    # Default prompt
    default_prompt = "A serene Japanese garden with a koi pond and cherry blossoms at sunset"
    prompt = st.text_area("Enter your prompt:", value=default_prompt, placeholder="Type your description here...")

    # Ensure models are downloaded only once
    try:
        llama_model = ensure_llama_model()
        sd_pipe = ensure_stable_diffusion_model()
    except Exception as e:
        st.error(f"Error setting up models: {str(e)}. Ensure 'ollama' is running and try again.")
        return

    if st.button("Generate Image"):
        if not prompt.strip():
            st.warning("Please enter a description.")
        else:
            with st.spinner("Generating description with LLaMA..."):
                description = generate_description(prompt, llama_model)
                st.write("Generated Description:")
                st.write(description)

            with st.spinner("Generating image..."):
                try:
                    # Generate image from description
                    image = generate_image_from_description(description, sd_pipe)
                    
                    # Convert image to bytes for display and download
                    img_byte_arr = BytesIO()
                    image.save(img_byte_arr, format="PNG")
                    img_byte_arr.seek(0)

                    # Display image
                    st.image(img_byte_arr, caption="Generated Image", use_container_width=True)

                    # Download button
                    st.download_button(
                        label="📥 Download Image",
                        data=img_byte_arr,
                        file_name="generated_image.png",
                        mime="image/png"
                    )
                except Exception as e:
                    st.error(f"Error generating image: {str(e)}")

    if st.button("Logout"):
        st.session_state["authenticated"] = False
        st.rerun()  

if "authenticated" not in st.session_state:
    st.session_state["authenticated"] = False

if not st.session_state["authenticated"]:
    login()
else:
    # Check if ollama is running
    try:
        ollama.list()
    except Exception as e:
        st.error("Error: Ensure 'ollama' is installed and running. Run 'ollama serve' in a terminal.")
        st.stop()

    generate_image()