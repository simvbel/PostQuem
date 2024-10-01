// Animation Script
window.addEventListener('load', function () {
    const textElements = document.querySelectorAll('.word');
    let hoverTimeout; // To track the hover timeout for smooth transitions

    // Fade in words after 6 seconds
    setTimeout(() => {
        textElements.forEach((element) => {
            element.classList.add('show');
            element.style.pointerEvents = 'auto'; // Enable interaction
        });
    }, 6000);

    // Initialize canvas and particle effects
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Responsive canvas sizing
    canvas.width = window.innerWidth;
    canvas.height = 400;

    class Particle {
        constructor(effect, x, y, color) {
            this.effect = effect;
            this.x = Math.random() * this.effect.canvasWidth;
            this.y = Math.random() * this.effect.canvasHeigth;
            this.color = color;
            this.originX = x;
            this.originY = y;
            this.size = this.effect.gap;
            this.vx = 0.35 + 0.15 * Math.random(); // Reduced speed
            this.vy = 0.35 + 0.15 * Math.random(); // Reduced speed
            this.targetX = x;
            this.targetY = y;
            this.friction = 0.7 + 0.2 * Math.random(); // Lower friction
            this.ease = Math.random() * 0.2 + 0.05; // Higher ease
            this.visible = true; // Add visibility property
        }

        draw() {
            if (this.visible) { // Draw only if visible
                this.effect.context.fillStyle = this.color;
                this.effect.context.fillRect(this.x, this.y, this.size, this.size);
            }
        }

        update() {
            const dx = this.effect.mouse.x - this.x;
            const dy = this.effect.mouse.y - this.y;
            const distance = dx * dx + dy * dy;
            const force = -this.effect.mouse.radius / distance;

            if (distance < this.effect.mouse.radius) {
                const angle = Math.atan2(dy, dx);
                this.vx += force * Math.cos(angle);
                this.vy += force * Math.sin(angle);
            }

            this.x += this.vx;
            this.y += this.vy;
            this.vx *= this.friction;
            this.vy *= this.friction;

            this.x += (this.targetX - this.x) * this.ease;
            this.y += (this.targetY - this.y) * this.ease;
        }
    }

    class Effect {
        constructor(context, canvasWidth, canvasHeight) {
            this.context = context;
            this.canvasWidth = canvasWidth;
            this.canvasHeigth = canvasHeight; // Make sure this is consistently used
            this.textX = this.canvasWidth / 2;
            this.textY = this.canvasHeigth / 2;

            // Dynamically adjust font size based on canvas width
            this.fontSize = Math.max(50, this.canvasWidth * 0.1);
            this.lineHeight = this.fontSize * 0.8;
            this.maxTextWidth = this.canvasWidth * 0.8;
            this.particles = [];
            this.gap = 1; // Updated gap
            this.currentText = '';
            this.transitioning = false;
            this.mouse = {
                radius: this.canvasWidth * 2,
                x: 0,
                y: 0
            };

            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.x;
                this.mouse.y = e.y;
            });
        }

        wrapText(text) {
            this.currentText = text;
            this.fontSize = Math.max(50, this.canvasWidth * 0.070); // Adjust font size dynamically
            this.lineHeight = this.fontSize * 0.8;
            const gradient = this.context.createLinearGradient(0, 0, this.canvasWidth, this.canvasHeigth);
            gradient.addColorStop(0.3, 'red');
            gradient.addColorStop(0.5, 'orange');
            gradient.addColorStop(0.7, 'yellow');
            this.context.fillStyle = 'white';
            this.context.textAlign = 'center';
            this.context.textBaseline = 'middle';
            this.context.lineWidth = 3;
            this.context.font = this.fontSize + 'px Helvetica';

            let linesArray = [];
            let words = text.split(' ');
            let lineCounter = 0;
            let line = '';
            for (let i = 0; i < words.length; i++) {
                let testLine = line + words[i] + ' ';
                if (this.context.measureText(testLine).width > this.maxTextWidth) {
                    line = words[i] + ' ';
                    lineCounter++;
                } else {
                    line = testLine;
                }
                linesArray[lineCounter] = line;
            }
            let textHeight = this.lineHeight * lineCounter;
            this.textY = this.canvasHeigth / 2 - textHeight / 2;
            this.context.clearRect(0, 0, this.canvasWidth, this.canvasHeigth); // Clear canvas
            linesArray.forEach((el, index) => {
                this.context.fillText(el, this.textX, this.textY + (index * this.lineHeight));
                this.context.strokeText(el, this.textX, this.textY + (index * this.lineHeight));
            });
            this.convertToParticles();
        }

        convertToParticles() {
            const newParticles = [];
            const pixels = this.context.getImageData(0, 0, this.canvasWidth, this.canvasHeigth).data;
            for (let y = 0; y < this.canvasHeigth; y += this.gap) {
                for (let x = 0; x < this.canvasWidth; x += this.gap) {
                    const index = (y * this.canvasWidth + x) * 4;
                    const alpha = pixels[index + 3];
                    if (alpha > 0) {
                        const red = pixels[index];
                        const green = pixels[index + 1];
                        const blue = pixels[index + 2];
                        const color = 'rgb(' + red + ',' + green + ',' + blue + ')';
                        newParticles.push(new Particle(this, x, y, color));
                    }
                }
            }

            // Remove particles before transitioning to new text
            this.particles.forEach((particle) => {
                particle.visible = false; // Set existing particles to not visible
            });

            // Update particles for new text
            newParticles.forEach((newParticle, index) => {
                if (this.particles[index]) {
                    // If there's an existing particle, update its target position and color
                    this.particles[index].targetX = newParticle.originX;
                    this.particles[index].targetY = newParticle.originY;
                    this.particles[index].color = newParticle.color;
                    this.particles[index].visible = true; // Make it visible
                } else {
                    // Otherwise, add the new particle
                    this.particles.push(newParticle);
                }
            });

            // Clean up any remaining particles that are still not visible
            this.particles = this.particles.filter(p => p.visible);
        }

        render() {
            this.particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
        }

        resize(width, height) {
            this.canvasWidth = width;
            this.canvasHeigth = height;
            this.textX = this.canvasWidth / 2;
            this.textY = this.canvasHeigth / 2;
            this.maxTextWidth = this.canvasWidth * 0.8;
            this.mouse.radius = this.canvasWidth * 2;
            this.wrapText(this.currentText); // Redraw text and particles after resize
        }

        updateText(text) {
            this.transitioning = true;
            this.wrapText(text);
        }
    }

    const effect = new Effect(ctx, canvas.width, canvas.height);

    // Display "Bienvenue chez" initially
    effect.wrapText('Bienvenue chez');

    // After 5 seconds, transition to "PostQuem"
    setTimeout(() => {
        console.log("Introduction");
        effect.updateText('PostQuem');
    }, 5000);

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        effect.render();
        requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', function () {
        canvas.width = window.innerWidth;
        canvas.height = 400;
        effect.resize(canvas.width, canvas.height); // Ensure proper text rendering on resize
    });

    // Add mouse hover event listeners to change text
    textElements.forEach((element) => {
        element.addEventListener('mouseover', () => {
            const newText = element.getAttribute('data-text');
            console.log(`Hovering over: ${newText}`);
            effect.updateText(newText);
            clearTimeout(hoverTimeout); // Clear any existing hover timeout
        });
    });

    // Handle mouse leave event to return to "PostQuem"
    textElements.forEach((element) => {
        element.addEventListener('mouseleave', () => {
            clearTimeout(hoverTimeout); // Clear any hover timeout
            hoverTimeout = setTimeout(() => {
                console.log("Mouse left, reverting to PostQuem");
                effect.updateText('PostQuem'); // Return to "PostQuem" after 3 seconds
            }, 3000); // 3 seconds delay
        });
    });
});

// Show content when links are clicked
document.addEventListener('DOMContentLoaded', function() {
    const aproposLink = document.getElementById("apropos-link");
    const servicesLink = document.getElementById('services-link');
    const contactsLink = document.getElementById('contacts-link');
    const aproposBlocks = document.getElementById("apropos-blocks");
    const servicesBlocks = document.getElementById('services-blocks');
    const contactsBlocks = document.getElementById('contacts-blocks');

    // Function to hide all blocks and show the selected one
    function hideAllBlocks() {
        aproposBlocks.style.display = 'none';
        servicesBlocks.style.display = 'none';
        contactsBlocks.style.display = 'none';
    }

    // Show Services content
    servicesLink.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default anchor behavior
        hideAllBlocks(); // Hide all content blocks
        servicesBlocks.style.display = 'flex'; // Show the services blocks
        servicesBlocks.classList.add('show'); // Add the show class for fade-in
    });

    // Show Contacts content
    contactsLink.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default anchor behavior
        hideAllBlocks(); // Hide all content blocks
        contactsBlocks.style.display = 'flex'; // Show the contacts blocks
        contactsBlocks.classList.add('show'); // Add the show class for fade-in
    });

    // Show À propos content
    aproposLink.addEventListener('click', function(event) {
        event.preventDefault(); // Prevent the default anchor behavior
        hideAllBlocks(); // Hide all content blocks
        aproposBlocks.style.display = 'flex'; // Show the À propos blocks
        aproposBlocks.classList.add('show'); // Add the show class for fade-in
    });
});


