fetch("example.svg")
    .then(r => r.text())
    .then(svg => {
        document.getElementById("svg-container").innerHTML = svg;
        animate();
    });

function animate() {
    window.animTimeline = buildScene();
}

function buildScene() {
    const tl = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: 0.5 });

    // 1. shape moves
    tl.to("#shape", {x:"+=600", y: "-=100", duration: 1 });

    return tl;
}
