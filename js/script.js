document.addEventListener('DOMContentLoaded', () => {
    const backToTopButton = document.createElement('button');
    backToTopButton.className = 'back-to-top';
    backToTopButton.innerHTML = '↑';
    backToTopButton.title = 'Volver arriba';
    document.body.appendChild(backToTopButton);

    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            backToTopButton.classList.add('visible');
        } else {
            backToTopButton.classList.remove('visible');
        }
    });

    backToTopButton.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    const paisMoneda = {
        "Italia": "EUR",
        "Francia": "EUR",
        "Bélgica": "EUR",
        "México": "MXN",
        "Estados Unidos": "USD",
        "Cuba": "CUP"
    };

    const botones = document.querySelectorAll('.filtro-btn');
    const tarjetasContainer = document.getElementById('contenedor-cards');
    const temaSelector = document.getElementById('temaSelector');
    const exchangeRateDisplay = document.createElement('div');
    exchangeRateDisplay.id = 'exchange-rate-display';
    exchangeRateDisplay.style.textAlign = 'center';
    exchangeRateDisplay.style.margin = '10px 0';
    exchangeRateDisplay.style.fontSize = '0.9em';
    document.querySelector('header').appendChild(exchangeRateDisplay);

    const formatDate = (date) => {
        if (!(date instanceof Date)) return "Fecha no disponible";
        
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        return date.toLocaleString('es-MX', options);
    };
    
    async function updateExchangeRates() {
        const base = window.monedaSeleccionada || "EUR";
        const today = new Date();
        const storedRates = localStorage.getItem('exchangeRates_' + base);

        try {
            let rates;

            if (storedRates) {
                const { date, rates: cachedRates } = JSON.parse(storedRates);
                if (date === today.toDateString()) {
                    rates = cachedRates;
                    rates.updated = new Date(rates.updated);
                    if (isNaN(rates.updated.getTime())) {
                        rates.updated = new Date();
                    }
                }
            }

            if (!rates) {
                if (base === "CUP") {
                    rates = {
                        USD: 0.042,
                        MXN: 0.72,
                        updated: new Date()
                    };
                } else {
                    const response = await fetch(`https://api.frankfurter.app/latest?from=${base}`);
                    const data = await response.json();
                    rates = {
                        USD: data.rates.USD || 1,
                        MXN: data.rates.MXN || 1,
                        updated: new Date()
                    };
                }

                localStorage.setItem('exchangeRates_' + base, JSON.stringify({
                    date: today.toDateString(),
                    rates
                }));
            }

            let cambioTexto = "";

            if (base === "EUR") {
                cambioTexto = `1 EUR = ${rates.USD.toFixed(2)} USD | ${rates.MXN.toFixed(2)} MXN`;
            } else if (base === "USD") {
                cambioTexto = `1 USD = ${(1 / rates.USD).toFixed(2)} EUR | ${(rates.MXN / rates.USD).toFixed(2)} MXN`;
            } else if (base === "MXN") {
                cambioTexto = `1 MXN = ${(1 / rates.MXN).toFixed(2)} EUR | ${(1 / (rates.MXN / rates.USD)).toFixed(2)} USD`;
            } else if (base === "CUP") {
                cambioTexto = `1 CUP ≈ ${rates.USD.toFixed(2)} USD | ${rates.MXN.toFixed(2)} MXN (estimado)`;
            } else {
                cambioTexto = `1 ${base} = ${rates.USD.toFixed(2)} USD | ${rates.MXN.toFixed(2)} MXN`;
            }

            exchangeRateDisplay.innerHTML = `
            <div class="exchange-info">
                <div class="exchange-title">💵 Tipo de cambio</div>
                <div class="exchange-rates">${cambioTexto}</div>
                <div class="exchange-time">Actualizado: ${formatDate(rates.updated)}</div>
            </div>
            `;

        } catch (error) {
            console.error("Error:", error);
            exchangeRateDisplay.innerHTML = `
            <div class="exchange-info error">
                <div class="exchange-title">💵 Tipo de cambio (estimado)</div>
                <div class="exchange-rates">No disponible para "${window.monedaSeleccionada || 'desconocido'}"</div>
                <div class="exchange-time">Última conexión: ${formatDate(new Date())}</div>
            </div>
            `;
        }
    }

    function loadCSVData() {
        const params = new URLSearchParams(window.location.search);
        const user = params.get('user');
        let csvPath = 'files/recomendaciones.csv';

        if (user) {
            csvPath = `files/recomendaciones_${user}.csv`;
        }

        fetch(csvPath)
            .then(response => {
                if (!response.ok) throw new Error('Archivo no encontrado');
                return response.text();
            })
            .then(data => {
                const rows = data.split('\n').slice(1);
                let monedaActual = "EUR";

                const primerFilaValida = rows.find(row => row.split(',').length >= 7 && row.trim() !== '');
                if (primerFilaValida) {
                    const columnas = primerFilaValida.split(',');
                    const pais = columnas[5]?.trim();
                    console.log("País detectado:", pais);
                    if (paisMoneda[pais]) {
                        monedaActual = paisMoneda[pais];
                    }
                }

                window.monedaSeleccionada = monedaActual;
                updateExchangeRates();
                const paises = {}; 

                rows.forEach(row => {
                    const columns = row.split(',');
                    const nombre = columns[0];
                    let tipo = columns[1];
                    const recomendacion = columns[2];
                    const precio = columns[3];
                    const enlace = columns[4];
                    const pais = columns[5];
                    const ciudad = columns[6];
                    
                    tipo = tipo.replace(/\s+/g, '_');

                    if (!paises[pais]) {
                        paises[pais] = {};
                    }
                    
                    if (!paises[pais][ciudad]) {
                        paises[pais][ciudad] = { Restaurantes: [], Turismo: [] };
                    }

                    const recommendation = {
                        nombre,
                        tipo,
                        recomendacion,
                        precio,
                        enlace
                    };

                    if (tipo !== 'Turismo') {
                        paises[pais][ciudad].Restaurantes.push(recommendation);
                    } else {
                        paises[pais][ciudad].Turismo.push({
                            nombre,
                            tipo,
                            precio,
                            enlace
                        });
                    }
                });

                Object.keys(paises).forEach((pais, index) => {
                    const countryContainer = document.createElement('div');
                    countryContainer.classList.add('pais-container', pais.toLowerCase());

                    const countryHeader = document.createElement('div');
                    countryHeader.classList.add('pais-header');

                    const countryTitle = document.createElement('h2');
                    countryTitle.textContent = pais;
                    countryHeader.appendChild(countryTitle);

                    const flagImage = document.createElement('img');
                    flagImage.classList.add('flag');
                    if (pais === 'Bélgica') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/commons/6/65/Flag_of_Belgium.svg';
                    } else if (pais === 'Francia') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Flag_of_France.svg';
                    } else if (pais === 'Italia') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/commons/0/03/Flag_of_Italy.svg';
                    } else if (pais === 'Cuba') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Flag_of_Cuba.svg';
                    } else if (pais === 'México') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/commons/f/fc/Flag_of_Mexico.svg';
                    } else if (pais === 'España') {
                        flagImage.src = 'https://upload.wikimedia.org/wikipedia/en/9/9a/Flag_of_Spain.svg';
                    }
                    countryHeader.appendChild(flagImage);
                    countryContainer.appendChild(countryHeader);

                    Object.keys(paises[pais]).forEach(ciudad => {
                        const cityContainer = document.createElement('div');
                        cityContainer.classList.add('ciudad-container');
                        cityContainer.dataset.ciudad = ciudad.toLowerCase();

                        const cityHeader = document.createElement('div');
                        cityHeader.classList.add('ciudad-header');
                        
                        const cityTitle = document.createElement('h3');
                        cityTitle.textContent = ciudad;
                        cityHeader.appendChild(cityTitle);
                        cityContainer.appendChild(cityHeader);

                        const ciudadContent = document.createElement('div');
                        ciudadContent.classList.add('ciudad-content');

                        if (paises[pais][ciudad].Restaurantes.length > 0) {
                            const restaurantesTitle = document.createElement('h4');
                            restaurantesTitle.textContent = 'Restaurantes';
                            restaurantesTitle.classList.add('restaurantes-title');
                            ciudadContent.appendChild(restaurantesTitle);

                            const restaurantsWrapper = document.createElement('div');
                            restaurantsWrapper.classList.add('cards-wrapper', 'restaurantes-wrapper');

                            paises[pais][ciudad].Restaurantes.forEach(item => {
                                const card = document.createElement('div');
                                card.classList.add('card', item.tipo);
                                card.innerHTML = `
                                    <h4>${item.nombre}</h4>
                                    <p><strong>Recomendación:</strong> ${item.recomendacion}</p>
                                    <p><strong>Precio:</strong> ${item.precio}</p>
                                    <a href="${item.enlace}" target="_blank">Ver en Google Maps</a>
                                `;
                                restaurantsWrapper.appendChild(card);
                            });
                            ciudadContent.appendChild(restaurantsWrapper);
                        }

                        if (paises[pais][ciudad].Turismo.length > 0) {
                            const turismoTitle = document.createElement('h4');
                            turismoTitle.textContent = 'Lugares Turísticos';
                            turismoTitle.classList.add('turismo-title');
                            ciudadContent.appendChild(turismoTitle);

                            const tourismWrapper = document.createElement('div');
                            tourismWrapper.classList.add('cards-wrapper', 'turismo-wrapper');

                            paises[pais][ciudad].Turismo.forEach(item => {
                                const card = document.createElement('div');
                                card.classList.add('card', item.tipo);
                                card.innerHTML = `
                                    <h4>${item.nombre}</h4>
                                    <p><strong>Precio:</strong> ${item.precio}</p>
                                    <a href="${item.enlace}" target="_blank">Ver en Google Maps</a>
                                `;
                                tourismWrapper.appendChild(card);
                            });
                            ciudadContent.appendChild(tourismWrapper);
                        }

                        cityContainer.appendChild(ciudadContent);

                        cityHeader.addEventListener('click', (e) => {
                            e.stopPropagation();
                            cityContainer.classList.toggle('expanded');
                            cityHeader.classList.toggle('expanded');
                        });

                        // Estado inicial para Bélgica (primer país)
                        if (index === 0) {
                            cityContainer.classList.add('expanded');
                            cityHeader.classList.add('expanded');
                        }

                        countryContainer.appendChild(cityContainer);
                    });

                    countryHeader.addEventListener('click', function(e) {
                        if (e.target === this || e.target === countryTitle || e.target === flagImage) {
                            countryContainer.classList.toggle('expanded');
                            this.classList.toggle('expanded');
                            
                            if (countryContainer.classList.contains('expanded')) {
                                countryContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                            }
                        }
                    });

                    if (index === 0) {
                        countryContainer.classList.add('expanded');
                        countryHeader.classList.add('expanded');
                    }

                    tarjetasContainer.appendChild(countryContainer);
                });
            })
            .catch(error => {
                console.error('Error loading CSV data:', error);
                tarjetasContainer.innerHTML = `
                    <div class="sin-info">
                        🛑 No hay información disponible para este usuario.
                    </div>
                `;
            });
    }

    function aplicarTema() {
        document.body.classList.toggle('dark-mode', temaSelector.checked);
    }

    function mostrarTarjetas(tipo) {
        const allCards = document.querySelectorAll('.card');
        const allRestaurantTitles = document.querySelectorAll('.restaurantes-title');
        const allTurismoTitles = document.querySelectorAll('.turismo-title');
        const allRestaurantWrappers = document.querySelectorAll('.restaurantes-wrapper');
        const allTurismoWrappers = document.querySelectorAll('.turismo-wrapper');

        if (tipo === 'todos') {
            allCards.forEach(card => card.style.display = 'block');
            allRestaurantTitles.forEach(title => title.style.display = 'block');
            allTurismoTitles.forEach(title => title.style.display = 'block');
            allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'flex');
        } else {
            allCards.forEach(card => card.style.display = 'none');
            allRestaurantTitles.forEach(title => title.style.display = 'none');
            allTurismoTitles.forEach(title => title.style.display = 'none');
            allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'none');
            allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'none');

            const cardsToShow = document.querySelectorAll(`.card.${tipo}`);
            cardsToShow.forEach(card => card.style.display = 'block');

            if (tipo === 'Turismo') {
                allTurismoTitles.forEach(title => title.style.display = 'block');
                allTurismoWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            } else {
                allRestaurantTitles.forEach(title => title.style.display = 'block');
                allRestaurantWrappers.forEach(wrapper => wrapper.style.display = 'flex');
            }
        }
    }

    temaSelector.addEventListener('change', aplicarTema);
    
    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            const tipo = boton.getAttribute('data-tipo');
            botones.forEach(btn => btn.classList.remove('active'));
            boton.classList.add('active');
            mostrarTarjetas(tipo);
        });
    });

    aplicarTema();
    loadCSVData();
    mostrarTarjetas('todos');
});