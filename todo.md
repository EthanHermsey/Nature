- berry bush - food meter - sprint
    - add 3 counters to player
    - player.eat, if able, fills 1 counter
    - on player animate -> 
       - decrease counter from each thing > update display; 
       - update the actual sprint buffer ( add value if sprinting )
       - update sprint display

- dig speed on slow machines
    - something something deltaTime

- multi ?
    - spelers id name chunkKey - bij verplaatsen van x chunks -> nieuwe connecties ophalen
    - server kan spelers dichtbij speler zoeken om aan elkaar te koppelen 
    - 1 speler is de 'server' voor sturen van chunk's adjustedIndices

    - DEDICATED server?
        - geeft chunkdata
        - connect players met elkaar zoals bovenstaand
        - doet dingen met chunkdata
        - sync > terrainadjust terwijl je data sturt naar andere player en shit ;p