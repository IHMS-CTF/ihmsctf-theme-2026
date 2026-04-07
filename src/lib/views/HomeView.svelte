<script lang="ts">
  import ihmsLogo from '../../assets/IHMS_CTF_1000_x_500_px1.png'
  import smefLogo from '../../assets/smef.png'
  import softwarfareLogo from '../../assets/SOFTwarfare+Logo+Web+Black+NoR-d837215d.png'
</script>

<div class="landing-wrap">
  <!--ihms{inspect_element}-->
  <img class="event-logo" src={ihmsLogo} alt="IHMS CTF" />

  <h5>2026 Edition</h5>

  <p>
    Welcome to the second annual IHMS Capture the Flag competition!
    This competition is intended to teach IHMS middle schoolers about cybersecurity.
  </p>

  <h5 class="sponsor-heading">Thank you to these organizations:</h5>

  <div class="sponsor-row" aria-label="Sponsors">
    <img class="sponsor-logo" src={smefLogo} alt="SMEF" />
    <img class="sponsor-logo" src={softwarfareLogo} alt="Softwarfare" />
  </div>
</div>

<style>
  .landing-wrap {
    max-width: 680px;
    margin: 0 auto;
    text-align: left;
    padding: var(--space-xl) 0;
  }

  .event-logo {
    max-width: 60%;
    height: auto;
    padding-bottom: 30px;
    display: block;
  }

  h5 {
    margin: 0 0 var(--space-sm);
    color: var(--text-primary);
    font-family: var(--font-display);
    font-size: 1rem;
    letter-spacing: 0.04em;
  }

  p {
    margin: 0 0 var(--space-lg);
    color: var(--text-secondary);
    line-height: 1.6;
    max-width: 58ch;
    white-space: pre-line;
  }

  .sponsor-heading {
    margin-bottom: 20px;
  }

  .sponsor-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 20px;
  }

  .sponsor-logo {
    width: 40%;
    min-width: 170px;
    height: auto;
    vertical-align: middle;
  }

  @media (max-width: 640px) {
    .event-logo {
      max-width: 85%;
    }

    .sponsor-logo {
      width: calc(50% - 10px);
      min-width: 130px;
    }
  }
</style>
